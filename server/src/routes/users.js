import { Router } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';
import { requireRole } from '../middleware/roles.js';

const router = Router();

// GET /api/users — Admin only
router.get('/', requireRole('admin'), async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const users = await User.findAll(page, limit);
    res.json({ users, page, limit });
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/users — Create user (admin only)
router.post('/', requireRole('admin'), async (req, res) => {
  try {
    const { username, email, password, display_name, role_id } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required' });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    // Uniqueness checks
    const byUsername = await User.findByUsername(username);
    if (byUsername) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const byEmail = await User.findByEmail(email);
    if (byEmail) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      passwordHash,
      displayName: display_name || username,
      roleId: role_id || 2,
    });

    res.status(201).json({ user });
  } catch (err) {
    console.error('Create user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/users/:id
router.get('/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ user });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/users/:id — Update user (admin only)
router.put('/:id', requireRole('admin'), async (req, res) => {
  try {
    const { username, email, display_name, role_id, is_active, password } = req.body;

    // Validate user exists
    const existing = await User.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Uniqueness checks
    if (username && username !== existing.username) {
      const byUsername = await User.findByUsername(username);
      if (byUsername) {
        return res.status(409).json({ error: 'Username already taken' });
      }
    }

    if (email && email !== existing.email) {
      const byEmail = await User.findByEmail(email);
      if (byEmail) {
        return res.status(409).json({ error: 'Email already in use' });
      }
    }

    const updates = {};
    if (username !== undefined) updates.username = username;
    if (email !== undefined) updates.email = email;
    if (display_name !== undefined) updates.display_name = display_name;
    if (role_id !== undefined) updates.role_id = role_id;
    if (is_active !== undefined) updates.is_active = is_active;
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
      }
      updates.password_hash = await bcrypt.hash(password, 10);
    }

    const user = await User.update(req.params.id, updates);
    res.json({ user });
  } catch (err) {
    console.error('Update user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/users/:id — Delete user (admin only)
router.delete('/:id', requireRole('admin'), async (req, res) => {
  try {
    // Don't allow deleting yourself
    if (parseInt(req.params.id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const existing = await User.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'User not found' });
    }

    await User.delete(req.params.id);
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    console.error('Delete user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
