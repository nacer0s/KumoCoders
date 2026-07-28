import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import User from '../models/User.js';
import db from '../config/db.js';
import { generateToken, verifyToken, optionalToken } from '../middleware/auth.js';

const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: 'lax',
  path: '/',
  maxAge: 24 * 60 * 60 * 1000, // 24h
};

const router = Router();

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(6).max(100),
  displayName: z.string().max(100).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const data = registerSchema.parse(req.body);
    const passwordHash = await bcrypt.hash(data.password, 10);

    const existing = await User.findByEmail(data.email);
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const user = await User.create({
      username: data.username,
      email: data.email,
      passwordHash,
      displayName: data.displayName,
    });

    const token = generateToken(user);
    res.cookie('kc_token', token, COOKIE_OPTS);
    await trackSession(user.id, req);
    res.status(201).json({ user, token });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const data = loginSchema.parse(req.body);
    const user = await User.findByEmail(data.email);

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const valid = await bcrypt.compare(data.password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken(user);
    res.cookie('kc_token', token, COOKIE_OPTS);
    await trackSession(user.id, req);
    const { password_hash, ...safeUser } = user;
    res.json({ user: safeUser, token });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/me
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/auth/session — Check cookie-based session (works cross-SPA)
router.get('/session', optionalToken, async (req, res) => {
  if (!req.user) {
    return res.json({ authenticated: false });
  }
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.json({ authenticated: false });
    const { password_hash, ...safeUser } = user;
    const token = generateToken(user);
    res.json({ authenticated: true, user: safeUser, token });
  } catch (err) {
    console.error('Session check error:', err);
    res.json({ authenticated: false });
  }
});

// POST /api/auth/logout — Clear session cookie
router.post('/logout', (req, res) => {
  res.clearCookie('kc_token', { path: '/' });
  res.json({ message: 'Logged out' });
});

// PUT /api/auth/password — Change own password (authenticated)
router.put('/password', verifyToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: 'New password must be at least 6 characters' });
    }

    // Fetch full user record to get password_hash
    const fullUser = await db('users').where({ id: req.user.id }).first();
    if (!fullUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const valid = await bcrypt.compare(currentPassword, fullUser.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await db('users').where({ id: req.user.id }).update({ password_hash: passwordHash });

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/refresh — Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'kumocoders-dev-secret-change-in-production');
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const newToken = generateToken(user);
    res.json({ token: newToken });
  } catch (err) {
    if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
    console.error('Refresh token error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/auth/profile — Update display name, bio, and avatar
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { display_name, displayName, bio, avatar_url } = req.body;
    const updates = {};
    if (display_name !== undefined) updates.display_name = display_name;
    else if (displayName !== undefined) updates.display_name = displayName;
    if (bio !== undefined) updates.bio = bio;
    if (avatar_url !== undefined) updates.avatar_url = avatar_url;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    await db('users').where({ id: req.user.id }).update(updates);
    const user = await User.findById(req.user.id);
    res.json({ user });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ══════════════════════════════════════════════════
//  SESSION MANAGEMENT
// ══════════════════════════════════════════════════

// Track session on login/register
async function trackSession(userId, req) {
  try {
    const existing = await db('sessions')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc')
      .first();
    if (existing) {
      const updates = { last_used_at: db.fn.now() };
      try { updates.user_agent = req.headers['user-agent']?.substring(0, 500) || null; } catch {}
      try { updates.ip_address = req.ip; } catch {}
      await db('sessions').where({ id: existing.id }).update(updates);
    }
  } catch { /* ignore */ }
}

// GET /api/auth/sessions — List active sessions (authenticated)
router.get('/sessions', verifyToken, async (req, res) => {
  try {
    let sessions = [];
    try {
      sessions = await db('sessions')
        .where({ user_id: req.user.id })
        .orderBy('created_at', 'desc')
        .select('id', 'created_at');
    } catch {}
    res.json({ sessions });
  } catch (err) {
    console.error('List sessions error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/sessions/revoke — Revoke a session (authenticated)
router.post('/sessions/revoke', verifyToken, async (req, res) => {
  try {
    const { session_id } = req.body;
    if (!session_id) return res.status(400).json({ error: 'session_id required' });
    await db('sessions').where({ id: session_id, user_id: req.user.id }).del();
    res.json({ message: 'Session revoked' });
  } catch (err) {
    console.error('Revoke session error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/auth/sessions/revoke-all — Revoke all sessions except current (authenticated)
router.post('/sessions/revoke-all', verifyToken, async (req, res) => {
  try {
    await db('sessions').where({ user_id: req.user.id }).del();
    res.json({ message: 'All sessions revoked' });
  } catch (err) {
    console.error('Revoke all sessions error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ══════════════════════════════════════════════════
//  DATA EXPORT
// ══════════════════════════════════════════════════

// POST /api/auth/export — Export user data (authenticated)
router.post('/export', verifyToken, async (req, res) => {
  try {
    const userData = await User.findById(req.user.id);
    const posts = await db('community_posts').where({ user_id: req.user.id }).select('id', 'title', 'body', 'tags', 'like_count', 'comment_count', 'created_at');
    const comments = await db('community_comments').where({ user_id: req.user.id }).select('id', 'post_id', 'body', 'like_count', 'created_at');
    const likes = await db('community_likes').where({ user_id: req.user.id }).select('target_type', 'target_id', 'created_at');
    const bookmarks = await db('community_bookmarks').join('community_posts', 'community_bookmarks.post_id', 'community_posts.id').where('community_bookmarks.user_id', req.user.id).select('community_posts.title', 'community_bookmarks.created_at');
    const badges = await db('community_user_badges').where({ user_id: req.user.id }).join('badges', 'community_user_badges.badge_id', 'badges.id').select('badges.name', 'badges.description', 'badges.icon', 'community_user_badges.awarded_at');
    const blocks = await db('community_blocks').where({ blocker_id: req.user.id }).join('users', 'community_blocks.blocked_id', 'users.id').select('users.username', 'community_blocks.created_at');

    const exportData = {
      exported_at: new Date().toISOString(),
      user: userData,
      posts,
      comments,
      likes,
      bookmarks,
      badges,
      blocked_users: blocks,
    };

    res.json({ export: exportData });
  } catch (err) {
    console.error('Data export error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/auth/delete — Delete account (authenticated)
router.delete('/delete', verifyToken, async (req, res) => {
  try {
    await db('users').where({ id: req.user.id }).del();
    res.clearCookie('kc_token', { path: '/' });
    res.json({ message: 'Account deleted' });
  } catch (err) {
    console.error('Delete account error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
