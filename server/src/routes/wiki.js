import { Router } from 'express';
import { z } from 'zod';
import WikiPage from '../models/WikiPage.js';
import { verifyToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

const router = Router();

const pageSchema = z.object({
  title: z.string().min(1).max(255),
  slug: z.string().max(255).optional().default(''),
  body: z.string().min(1),
  category: z.string().max(100).optional().default(''),
});

// ─── Admin routes (must be before public :slug routes!) ───

router.get('/admin/all', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { page, limit, category, search } = req.query;
    const result = await WikiPage.findAll({
      page: parseInt(page) || 1,
      limit: Math.min(parseInt(limit) || 50, 100),
      category,
      search,
    });
    res.json(result);
  } catch (err) {
    console.error('Admin list wiki pages error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/admin/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const page = await WikiPage.findById(req.params.id);
    if (!page) return res.status(404).json({ error: 'Wiki page not found' });
    res.json({ page });
  } catch (err) {
    console.error('Admin get wiki page error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Public routes ────────────────────────────────

// GET /api/wiki — Latest wiki pages
router.get('/', async (req, res) => {
  try {
    const { limit } = req.query;
    if (limit) {
      const pages = await WikiPage.findLatest(parseInt(limit) || 3);
      return res.json({ pages });
    }
    const { page, limit: pageLimit, category, search } = req.query;
    const result = await WikiPage.findAll({
      page: parseInt(page) || 1,
      limit: Math.min(parseInt(pageLimit) || 20, 50),
      category,
      search,
    });
    res.json(result);
  } catch (err) {
    console.error('List wiki pages error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/wiki/:slug — Get wiki page by slug
router.get('/:slug', async (req, res) => {
  try {
    // Skip if looks like an admin route
    if (req.params.slug === 'admin') return res.status(404).json({ error: 'Wiki page not found' });
    const page = await WikiPage.findBySlug(req.params.slug);
    if (!page) return res.status(404).json({ error: 'Wiki page not found' });
    res.json({ page });
  } catch (err) {
    console.error('Get wiki page error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const data = pageSchema.parse(req.body);
    let slug = data.slug;
    if (!slug || slug.trim() === '') {
      slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }
    const existing = await WikiPage.findBySlug(slug);
    if (existing) slug = slug + '-' + Date.now();
    const page = await WikiPage.create({ ...data, slug });
    res.status(201).json({ page });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: err.errors });
    console.error('Create wiki page error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const page = await WikiPage.findById(req.params.id);
    if (!page) return res.status(404).json({ error: 'Wiki page not found' });
    const data = pageSchema.partial().parse(req.body);
    const updated = await WikiPage.update(parseInt(req.params.id), data);
    res.json({ page: updated });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: err.errors });
    console.error('Update wiki page error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const page = await WikiPage.findById(req.params.id);
    if (!page) return res.status(404).json({ error: 'Wiki page not found' });
    await WikiPage.delete(parseInt(req.params.id));
    res.json({ message: 'Wiki page deleted' });
  } catch (err) {
    console.error('Delete wiki page error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
