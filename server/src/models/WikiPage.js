import db from '../config/db.js';

const WikiPage = {
  async findAll({ page = 1, limit = 50, category, search } = {}) {
    const offset = (page - 1) * limit;
    let countQuery = db('wiki_pages');
    let dataQuery = db('wiki_pages');

    if (category) {
      countQuery = countQuery.where({ category });
      dataQuery = dataQuery.where({ category });
    }
    if (search) {
      const like = `%${search}%`;
      countQuery = countQuery.where(function () {
        this.where('title', 'like', like).orWhere('body', 'like', like);
      });
      dataQuery = dataQuery.where(function () {
        this.where('title', 'like', like).orWhere('body', 'like', like);
      });
    }

    const [{ count }] = await countQuery.count('* as count');
    const pages = await dataQuery
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return { pages, total: count, page, limit, totalPages: Math.ceil(count / limit) };
  },

  async findLatest(limit = 3) {
    return db('wiki_pages')
      .orderBy('created_at', 'desc')
      .limit(limit);
  },

  async findById(id) {
    return db('wiki_pages').where({ id }).first();
  },

  async findBySlug(slug) {
    return db('wiki_pages').where({ slug }).first();
  },

  async create(data) {
    const [id] = await db('wiki_pages').insert({
      title: data.title,
      slug: data.slug,
      body: data.body,
      category: data.category || null,
    });
    return this.findById(id);
  },

  async update(id, data) {
    const updates = {};
    if (data.title !== undefined) updates.title = data.title;
    if (data.slug !== undefined) updates.slug = data.slug;
    if (data.body !== undefined) updates.body = data.body;
    if (data.category !== undefined) updates.category = data.category;

    await db('wiki_pages').where({ id }).update(updates);
    return this.findById(id);
  },

  async delete(id) {
    return db('wiki_pages').where({ id }).del();
  },
};

export default WikiPage;
