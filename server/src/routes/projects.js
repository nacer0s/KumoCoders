import { Router } from 'express';
import { z } from 'zod';
import Project from '../models/Project.js';
import { verifyToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

const router = Router();

const projectSchema = z.object({
  title: z.string().min(1).max(255),
  slug: z.string().max(255).optional().default(''),
  description: z.string().optional().default(''),
  long_description: z.string().optional().default(''),
  image_url: z.string().max(500).optional().default(''),
  tech_stack: z.string().max(500).optional().default(''),
  live_url: z.string().max(500).optional().default(''),
  github_url: z.string().max(500).optional().default(''),
  status: z.enum(['active', 'archived', 'planned']).optional().default('active'),
  featured: z.union([z.boolean(), z.number()]).optional().default(false),
  sort_order: z.number().int().optional().default(0),
});

// ─── Public routes ────────────────────────────────

// GET /api/projects — List all active projects (public)
router.get('/', async (req, res) => {
  try {
    const { page, limit, search } = req.query;
    const result = await Project.findAll({
      page: parseInt(page) || 1,
      limit: Math.min(parseInt(limit) || 50, 100),
      status: 'active',
      search,
    });
    res.json(result);
  } catch (err) {
    console.error('List projects error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/projects/featured — Featured projects (public)
router.get('/featured', async (req, res) => {
  try {
    const projects = await Project.findFeatured(parseInt(req.query.limit) || 6);
    res.json({ projects });
  } catch (err) {
    console.error('Featured projects error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Admin routes (must be before public :slug routes!) ───

// GET /api/projects/admin/all — All projects (admin, includes hidden)
router.get('/admin/all', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { page, limit, status, search } = req.query;
    const result = await Project.findAll({
      page: parseInt(page) || 1,
      limit: Math.min(parseInt(limit) || 50, 100),
      status,
      search,
    });
    res.json(result);
  } catch (err) {
    console.error('Admin list projects error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/projects/admin/:id — Get project by ID (admin)
router.get('/admin/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json({ project });
  } catch (err) {
    console.error('Admin get project error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/projects/:slug — Get project by slug (public)
router.get('/:slug', async (req, res) => {
  try {
    // Skip if looks like an admin route
    if (req.params.slug === 'admin') return res.status(404).json({ error: 'Project not found' });
    const project = await Project.findBySlug(req.params.slug);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    res.json({ project });
  } catch (err) {
    console.error('Get project error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/projects — Create project (admin)
router.post('/', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const data = projectSchema.parse(req.body);
    // Auto-generate slug from title if not provided
    let slug = data.slug;
    if (!slug || slug.trim() === '') {
      slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    }
    // Ensure unique slug
    const existing = await Project.findBySlug(slug);
    if (existing) {
      slug = slug + '-' + Date.now();
    }
    const project = await Project.create({ ...data, slug });
    res.status(201).json({ project });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('Create project error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/projects/:id — Update project (admin)
router.put('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const data = projectSchema.partial().parse(req.body);
    const updated = await Project.update(parseInt(req.params.id), data);
    res.json({ project: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('Update project error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/projects/:id — Delete project (admin)
router.delete('/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ error: 'Project not found' });
    await Project.delete(parseInt(req.params.id));
    res.json({ message: 'Project deleted' });
  } catch (err) {
    console.error('Delete project error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
