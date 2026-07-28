import { Router } from 'express';
import { z } from 'zod';
import JoinSubmission from '../models/JoinSubmission.js';
import { verifyToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

const router = Router();

const submitSchema = z.object({
  first_name: z.string().min(1).max(100),
  last_name: z.string().min(1).max(100),
  email: z.string().email().max(255),
  phone: z.string().max(50).optional().default(''),
  country: z.string().max(100).optional().default(''),
  current_role: z.string().max(200).optional().default(''),
  years_experience: z.enum(['', '0-1', '1-3', '3-5', '5-10', '10+']).optional().default(''),
  availability: z.enum(['', 'few_hours', 'part_time', 'full_time', 'weekends', 'not_sure']).optional().default(''),
  interest_type: z.enum(['join_team', 'collaborate', 'open_source', 'general', 'other']).optional().default('general'),
  skills: z.string().max(2000).optional().default(''),
  portfolio_url: z.string().max(500).optional().default(''),
  linkedin_url: z.string().max(500).optional().default(''),
  twitter_url: z.string().max(500).optional().default(''),
  discord_username: z.string().max(100).optional().default(''),
  hear_about: z.string().max(200).optional().default(''),
  message: z.string().max(5000).optional().default(''),
});

// ─── Public: Submit ──────────────────────────────────────────
router.post('/submit', async (req, res) => {
  try {
    const data = submitSchema.parse(req.body);
    const submission = await JoinSubmission.create(data);
    res.status(201).json({
      message: 'Application submitted successfully!',
      submission: {
        id: submission.id,
        tracking_token: submission.tracking_token,
        status: submission.status,
      },
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('Join submit error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Public: Track by token ──────────────────────────────────
router.get('/track/:token', async (req, res) => {
  try {
    const submission = await JoinSubmission.findByToken(req.params.token);
    if (!submission) return res.status(404).json({ error: 'Application not found' });
    res.json({
      status: submission.status,
      status_updated_at: submission.status_updated_at,
      created_at: submission.created_at,
    });
  } catch (err) {
    console.error('Join track error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Admin: List all ─────────────────────────────────────────
router.get('/admin/all', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { page, limit } = req.query;
    const result = await JoinSubmission.findAll({
      page: parseInt(page) || 1,
      limit: Math.min(parseInt(limit) || 50, 100),
    });
    res.json(result);
  } catch (err) {
    console.error('Admin list submissions error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Admin: Get single ───────────────────────────────────────
router.get('/admin/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const submission = await JoinSubmission.findById(req.params.id);
    if (!submission) return res.status(404).json({ error: 'Submission not found' });
    res.json({ submission });
  } catch (err) {
    console.error('Admin get submission error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Admin: Accept ───────────────────────────────────────────
router.put('/admin/:id/accept', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const submission = await JoinSubmission.findById(req.params.id);
    if (!submission) return res.status(404).json({ error: 'Submission not found' });
    if (submission.status !== 'pending') return res.status(400).json({ error: `Application already ${submission.status}` });

    const updated = await JoinSubmission.updateStatus(req.params.id, 'accepted', req.body.review_notes || null);
    res.json({ message: 'Application accepted!', submission: updated });
  } catch (err) {
    console.error('Admin accept error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Admin: Refuse ───────────────────────────────────────────
router.put('/admin/:id/refuse', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const submission = await JoinSubmission.findById(req.params.id);
    if (!submission) return res.status(404).json({ error: 'Submission not found' });
    if (submission.status !== 'pending') return res.status(400).json({ error: `Application already ${submission.status}` });

    const updated = await JoinSubmission.updateStatus(req.params.id, 'refused', req.body.review_notes || null);
    res.json({ message: 'Application refused.', submission: updated });
  } catch (err) {
    console.error('Admin refuse error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Admin: Delete ───────────────────────────────────────────
router.delete('/admin/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const sub = await JoinSubmission.delete(req.params.id);
    if (!sub) return res.status(404).json({ error: 'Submission not found' });
    res.json({ message: 'Submission deleted' });
  } catch (err) {
    console.error('Admin delete submission error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
