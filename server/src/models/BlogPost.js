import db from '../config/db.js';

const BlogPost = {
  async findAll({ page = 1, limit = 50, search } = {}) {
    const offset = (page - 1) * limit;
    let countQuery = db('blog_posts');
    let dataQuery = db('blog_posts');

    if (search) {
      const like = `%${search}%`;
      countQuery = countQuery.where(function () {
        this.where('title', 'like', like).orWhere('excerpt', 'like', like);
      });
      dataQuery = dataQuery.where(function () {
        this.where('title', 'like', like).orWhere('excerpt', 'like', like);
      });
    }

    const [{ count }] = await countQuery.count('* as count');
    const posts = await dataQuery
      .orderBy('published_at', 'desc')
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return { posts, total: count, page, limit, pages: Math.ceil(count / limit) };
  },

  async findLatest(limit = 3) {
    return db('blog_posts')
      .whereNotNull('published_at')
      .orderBy('published_at', 'desc')
      .limit(limit);
  },

  async findById(id) {
    return db('blog_posts').where({ id }).first();
  },

  async findBySlug(slug) {
    return db('blog_posts').where({ slug }).first();
  },

  async create(data) {
    const [id] = await db('blog_posts').insert({
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt || null,
      body: data.body,
      image_url: data.image_url || null,
      author_id: data.author_id || null,
      published_at: data.published_at || null,
    });
    return this.findById(id);
  },

  async update(id, data) {
    const updates = {};
    if (data.title !== undefined) updates.title = data.title;
    if (data.slug !== undefined) updates.slug = data.slug;
    if (data.excerpt !== undefined) updates.excerpt = data.excerpt;
    if (data.body !== undefined) updates.body = data.body;
    if (data.image_url !== undefined) updates.image_url = data.image_url;
    if (data.author_id !== undefined) updates.author_id = data.author_id;
    if (data.published_at !== undefined) updates.published_at = data.published_at;

    await db('blog_posts').where({ id }).update(updates);
    return this.findById(id);
  },

  async delete(id) {
    return db('blog_posts').where({ id }).del();
  },
};

export default BlogPost;
