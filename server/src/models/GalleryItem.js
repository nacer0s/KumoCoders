import db from '../config/db.js';

const GalleryItem = {
  async findAll({ page = 1, limit = 50, category, featured, search } = {}) {
    const offset = (page - 1) * limit;
    let countQuery = db('gallery_items');
    let dataQuery = db('gallery_items');

    if (category) {
      countQuery = countQuery.where({ category });
      dataQuery = dataQuery.where({ category });
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
    const items = await dataQuery
      .orderBy('sort_order', 'asc')
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return { items, total: count, page, limit, pages: Math.ceil(count / limit) };
  },

  async findById(id) {
    return db('gallery_items').where({ id }).first();
  },

  async findBySlug(slug) {
    return db('gallery_items').where({ slug }).first();
  },

  async findFeatured(limit = 6) {
    return db('gallery_items')
      .where({ featured: 1 })
      .orderBy('sort_order', 'asc')
      .orderBy('created_at', 'desc')
      .limit(limit);
  },

  async create(data) {
    const [id] = await db('gallery_items').insert({
      title: data.title,
      slug: data.slug,
      description: data.description || null,
      image_url: data.image_url,
      category: data.category || 'other',
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
    if (data.image_url !== undefined) updates.image_url = data.image_url;
    if (data.category !== undefined) updates.category = data.category;
    if (data.featured !== undefined) updates.featured = data.featured ? 1 : 0;
    if (data.sort_order !== undefined) updates.sort_order = data.sort_order;

    await db('gallery_items').where({ id }).update(updates);
    return this.findById(id);
  },

  async delete(id) {
    return db('gallery_items').where({ id }).del();
  },
};

export default GalleryItem;
