import db from '../config/db.js';

const Feedback = {
  async findAll({ page = 1, limit = 20, category, sort = 'new' } = {}) {
    const offset = (page - 1) * limit;
    let query = db('feedback').leftJoin('users', 'feedback.user_id', 'users.id')
      .select('feedback.*', 'users.username', 'users.display_name', 'users.avatar_url');
    if (category) query = query.where('feedback.category', category);
    const [{ count }] = await db('feedback').count('* as count');
    if (sort === 'top') query = query.orderBy('feedback.vote_count', 'desc');
    else query = query.orderBy('feedback.created_at', 'desc');
    const items = await query.limit(limit).offset(offset);
    return { items, total: count };
  },

  async findById(id) {
    return db('feedback').leftJoin('users', 'feedback.user_id', 'users.id')
      .select('feedback.*', 'users.username', 'users.display_name', 'users.avatar_url')
      .where('feedback.id', id).first();
  },

  async create(data) {
    const [id] = await db('feedback').insert({ user_id: data.userId, title: data.title, body: data.body, category: data.category || 'general' });
    return this.findById(id);
  },

  async updateStatus(id, status) {
    await db('feedback').where({ id }).update({ status });
    return this.findById(id);
  },

  async vote(feedbackId, userId) {
    const existing = await db('feedback_votes').where({ feedback_id: feedbackId, user_id: userId }).first();
    if (existing) {
      await db('feedback_votes').where({ id: existing.id }).del();
      await db('feedback').where({ id: feedbackId }).decrement('vote_count', 1);
      return { voted: false };
    }
    await db('feedback_votes').insert({ feedback_id: feedbackId, user_id: userId });
    await db('feedback').where({ id: feedbackId }).increment('vote_count', 1);
    return { voted: true };
  },

  async hasVoted(feedbackId, userId) {
    const row = await db('feedback_votes').where({ feedback_id: feedbackId, user_id: userId }).first();
    return !!row;
  },
};

export default Feedback;
