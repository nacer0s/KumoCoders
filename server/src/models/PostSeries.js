import db from '../config/db.js';

const PostSeries = {
  async findByUser(userId) {
    return db('post_series').where({ user_id: userId }).orderBy('created_at', 'desc');
  },

  async findById(id) {
    return db('post_series').where({ id }).first();
  },

  async create(data) {
    const [id] = await db('post_series').insert({ user_id: data.userId, title: data.title, description: data.description || null });
    return db('post_series').where({ id }).first();
  },

  async getPosts(seriesId) {
    return db('community_posts').where({ series_id: seriesId, status: 'published' }).orderBy('series_order', 'asc');
  },
};

export default PostSeries;
