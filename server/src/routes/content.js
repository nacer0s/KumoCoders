import { Router } from 'express';
import LandingContent from '../models/LandingContent.js';
import { verifyToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { getIO } from '../socket/index.js';

const router = Router();

// GET /api/content — Get all sections
router.get('/', async (req, res) => {
  try {
    const content = await LandingContent.findAll();
    // Parse JSON metadata for each entry
    const parsed = content.map(c => ({
      ...c,
      metadata: typeof c.metadata === 'string' ? JSON.parse(c.metadata) : c.metadata,
    }));
    res.json({ content: parsed });
  } catch (err) {
    console.error('Get content error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/content/:sectionKey — Get specific section
router.get('/:sectionKey', async (req, res) => {
  try {
    const content = await LandingContent.findByKey(req.params.sectionKey);
    if (!content) {
      return res.status(404).json({ error: 'Section not found' });
    }
    res.json({
      content: {
        ...content,
        metadata: typeof content.metadata === 'string'
          ? JSON.parse(content.metadata)
          : content.metadata,
      },
    });
  } catch (err) {
    console.error('Get section error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/content — Create new section (admin only)
router.post('/', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { section_key, title, subtitle, body, metadata } = req.body;

    if (!section_key || !section_key.trim()) {
      return res.status(400).json({ error: 'section_key is required' });
    }

    // Check if section already exists
    const existing = await LandingContent.findByKey(section_key.trim());
    if (existing) {
      return res.status(409).json({ error: 'Section with this key already exists' });
    }

    const content = await LandingContent.upsert(section_key.trim(), {
      title,
      subtitle,
      body,
      metadata,
      updatedBy: req.user.id,
    });

    res.status(201).json({
      content: {
        ...content,
        metadata: typeof content.metadata === 'string'
          ? JSON.parse(content.metadata)
          : content.metadata,
      },
    });
  } catch (err) {
    console.error('Create section error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/content/:sectionKey — Update section (admin only)
router.put('/:sectionKey', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { title, subtitle, body, metadata } = req.body;
    const content = await LandingContent.upsert(req.params.sectionKey, {
      title,
      subtitle,
      body,
      metadata,
      updatedBy: req.user.id,
    });
    const parsed = {
      ...content,
      metadata: typeof content.metadata === 'string'
        ? JSON.parse(content.metadata)
        : content.metadata,
    };
    res.json({ content: parsed });

    // Broadcast real-time update to landing page clients
    try {
      getIO().to('app:landing').emit('content:updated', {
        sectionKey: req.params.sectionKey,
        content: parsed,
      });
    } catch (socketErr) {
      // Socket.IO not available — skip broadcast
    }
  } catch (err) {
    console.error('Update section error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
