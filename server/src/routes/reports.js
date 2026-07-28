import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import Report from '../models/Report.js';

const router = Router();

// ─── POST /api/reports — Submit a new report ─────────────────
router.post('/', verifyToken, async (req, res) => {
  try {
    const { type, title, description, severity } = req.body;

    if (!type || !title || !description) {
      return res.status(400).json({ error: 'Type, title, and description are required' });
    }

    const validTypes = ['bug', 'feature', 'feedback', 'other'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid report type' });
    }

    const report = await Report.create({
      userId: req.user.id,
      type,
      title,
      description,
      severity,
    });

    res.status(201).json({ report });
  } catch (err) {
    console.error('[Reports] Create error:', err);
    res.status(500).json({ error: 'Failed to submit report' });
  }
});

// ─── GET /api/reports — List all reports (admin only) ─────────
router.get('/', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { status, type, page } = req.query;
    const result = await Report.findAll({
      status,
      type,
      page: parseInt(page) || 1,
    });
    res.json(result);
  } catch (err) {
    console.error('[Reports] List error:', err);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// ─── GET /api/reports/my — Current user's reports ─────────────
router.get('/my', verifyToken, async (req, res) => {
  try {
    const reports = await Report.findByUserId(req.user.id);
    res.json({ reports });
  } catch (err) {
    console.error('[Reports] My reports error:', err);
    res.status(500).json({ error: 'Failed to fetch your reports' });
  }
});

// ─── PUT /api/reports/:id — Update report status (admin only) ─
router.put('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const report = await Report.updateStatus(parseInt(id), { status, adminNotes });
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    res.json({ report });
  } catch (err) {
    console.error('[Reports] Update error:', err);
    res.status(500).json({ error: 'Failed to update report' });
  }
});

export default router;
