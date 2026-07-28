import db from '../config/db.js';

const Project = {
  async findAll({ page = 1, limit = 50, status, featured, search } = {}) {
    const offset = (page - 1) * limit;
    let countQuery = db('projects');
    let dataQuery = db('projects');

    if (status) {
      countQuery = countQuery.where({ status });
      dataQuery = dataQuery.where({ status });
    }
    if (featured !== undefined) {
      countQuery = countQuery.where({ featured: featured ? 1 : 0 });
      dataQuery = dataQuery.where({ featured: featured ? 1 : 0 });
    }
    if (search) {
      const like = `%${search}%`;
      countQuery = countQuery.where(function () {
        this.where('title', 'like', like).orWhere('description', 'like', like);
      });
      dataQuery = dataQuery.where(function () {
        this.where('title', 'like', like).orWhere('description', 'like', like);
      });
    }

    const [{ count }] = await countQuery.count('* as count');
    const projects = await dataQuery
      .orderBy('sort_order', 'asc')
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return { projects, total: count, page, limit, pages: Math.ceil(count / limit) };
  },

  async findById(id) {
    return db('projects').where({ id }).first();
  },

  async findBySlug(slug) {
    return db('projects').where({ slug }).first();
  },

  async findFeatured(limit = 6) {
    return db('projects')
      .where({ featured: 1, status: 'active' })
      .orderBy('sort_order', 'asc')
      .orderBy('created_at', 'desc')
      .limit(limit);
  },

  async create(data) {
    const [id] = await db('projects').insert({
      title: data.title,
      slug: data.slug,
      description: data.description || null,
      long_description: data.long_description || null,
      image_url: data.image_url || null,
      tech_stack: data.tech_stack || null,
      live_url: data.live_url || null,
      github_url: data.github_url || null,
      status: data.status || 'active',
      featured: data.featured ? 1 : 0,
      sort_order: data.sort_order || 0,
    });
    return this.findById(id);
  },

  async update(id, data) {
    const updates = {};
    if (data.title !== undefined) updates.title = data.title;
    if (data.slug !== undefined) updates.slug = data.slug;
    if (data.description !== undefined) updates.description = data.description;
    if (data.long_description !== undefined) updates.long_description = data.long_description;
    if (data.image_url !== undefined) updates.image_url = data.image_url;
    if (data.tech_stack !== undefined) updates.tech_stack = data.tech_stack;
    if (data.live_url !== undefined) updates.live_url = data.live_url;
    if (data.github_url !== undefined) updates.github_url = data.github_url;
    if (data.status !== undefined) updates.status = data.status;
    if (data.featured !== undefined) updates.featured = data.featured ? 1 : 0;
    if (data.sort_order !== undefined) updates.sort_order = data.sort_order;

    await db('projects').where({ id }).update(updates);
    return this.findById(id);
  },

  async delete(id) {
    return db('projects').where({ id }).del();
  },
};

export default Project;
