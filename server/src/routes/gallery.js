import { Router } from 'express';
import { z } from 'zod';
import GalleryItem from '../models/GalleryItem.js';
import { verifyToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

const router = Router();

const itemSchema = z.object({
  title: z.string().min(1).max(255),
  slug: z.string().max(255).optional().default(''),
  description: z.string().optional().default(''),
  image_url: z.string().min(1).max(500),
  category: z.enum(['design', 'development', 'photography', 'other']).optional().default('other'),
  featured: z.union([z.boolean(), z.number()]).optional().default(false),
  sort_order: z.number().int().optional().default(0),
});

// ─── Public routes ────────────────────────────────

// GET /api/gallery — List gallery items
router.get('/', async (req, res) => {
  try {
    const { page, limit, category, search } = req.query;
    const result = await GalleryItem.findAll({
      page: parseInt(page) || 1,
      limit: Math.min(parseInt(limit) || 50, 100),
      category,
      search,
    });
    res.json(result);
  } catch (err) {
    console.error('List gallery items error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/gallery/featured — Featured items
router.get('/featured', async (req, res) => {
  try {
    const items = await GalleryItem.findFeatured(parseInt(req.query.limit) || 6);
    res.json({ items });
  } catch (err) {
    console.error('Featured gallery items error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/gallery/:slug — Get item by slug
router.get('/:slug', async (req, res) => {
  try {
    const item = await GalleryItem.findBySlug(req.params.slug);
    if (!item) return res.status(404).json({ error: 'Gallery item not found' });
    res.json({ item });
  } catch (err) {
    console.error('Get gallery item error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Admin routes ─────────────────────────────────

router.get('/admin/all', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { page, limit, category, search } = req.query;
    const result = await GalleryItem.findAll({
      page: parseInt(page) || 1,
      limit: Math.min(parseInt(limit) || 50, 100),
      category,
      search,
    });
    res.json(result);
  } catch (err) {
    console.error('Admin list gallery items error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/admin/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const item = await GalleryItem.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Gallery item not found' });
    res.json({ item });
  } catch (err) {
    console.error('Admin get gallery item error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const data = itemSchema.parse(req.body);
    let slug = data.slug;
    if (!slug || slug.trim() === '') {
      slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }
    const existing = await GalleryItem.findBySlug(slug);
    if (existing) slug = slug + '-' + Date.now();
    const item = await GalleryItem.create({ ...data, slug });
    res.status(201).json({ item });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: err.errors });
    console.error('Create gallery item error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const item = await GalleryItem.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Gallery item not found' });
    const data = itemSchema.partial().parse(req.body);
    const updated = await GalleryItem.update(parseInt(req.params.id), data);
    res.json({ item: updated });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: err.errors });
    console.error('Update gallery item error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const item = await GalleryItem.findById(req.params.id);
    if (!item) return res.status(404).json({ error: 'Gallery item not found' });
    await GalleryItem.delete(parseInt(req.params.id));
    res.json({ message: 'Gallery item deleted' });
  } catch (err) {
    console.error('Delete gallery item error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
