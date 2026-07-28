import { Router } from 'express';
import { z } from 'zod';
import BlogPost from '../models/BlogPost.js';
import { verifyToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

const router = Router();

const postSchema = z.object({
  title: z.string().min(1).max(255),
  slug: z.string().max(255).optional().default(''),
  excerpt: z.string().optional().default(''),
  body: z.string().min(1),
  image_url: z.string().max(500).optional().default(''),
  author_id: z.number().int().optional().nullable(),
  published_at: z.string().optional().nullable(),
});

// ─── Admin routes (must be before public :slug routes!) ───

router.get('/admin/all', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { page, limit, search } = req.query;
    const result = await BlogPost.findAll({
      page: parseInt(page) || 1,
      limit: Math.min(parseInt(limit) || 50, 100),
      search,
    });
    res.json(result);
  } catch (err) {
    console.error('Admin list blog posts error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/admin/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Blog post not found' });
    res.json({ post });
  } catch (err) {
    console.error('Admin get blog post error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Public routes ────────────────────────────────

// GET /api/blog — Latest published posts
router.get('/', async (req, res) => {
  try {
    const { limit } = req.query;
    if (limit) {
      const posts = await BlogPost.findLatest(parseInt(limit) || 3);
      return res.json({ posts });
    }
    const { page, limit: pageLimit, search } = req.query;
    const result = await BlogPost.findAll({
      page: parseInt(page) || 1,
      limit: Math.min(parseInt(pageLimit) || 20, 50),
      search,
    });
    res.json(result);
  } catch (err) {
    console.error('List blog posts error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/blog/:slug — Get blog post by slug
router.get('/:slug', async (req, res) => {
  try {
    // Skip if looks like an admin route
    if (req.params.slug === 'admin') return res.status(404).json({ error: 'Blog post not found' });
    const post = await BlogPost.findBySlug(req.params.slug);
    if (!post) return res.status(404).json({ error: 'Blog post not found' });
    res.json({ post });
  } catch (err) {
    console.error('Get blog post error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const data = postSchema.parse(req.body);
    let slug = data.slug;
    if (!slug || slug.trim() === '') {
      slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }
    const existing = await BlogPost.findBySlug(slug);
    if (existing) slug = slug + '-' + Date.now();
    const post = await BlogPost.create({ ...data, slug, author_id: data.author_id || req.user?.userId });
    res.status(201).json({ post });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: err.errors });
    console.error('Create blog post error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.put('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Blog post not found' });
    const data = postSchema.partial().parse(req.body);
    const updated = await BlogPost.update(parseInt(req.params.id), data);
    res.json({ post: updated });
  } catch (err) {
    if (err instanceof z.ZodError) return res.status(400).json({ error: 'Validation failed', details: err.errors });
    console.error('Update blog post error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const post = await BlogPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Blog post not found' });
    await BlogPost.delete(parseInt(req.params.id));
    res.json({ message: 'Blog post deleted' });
  } catch (err) {
    console.error('Delete blog post error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
