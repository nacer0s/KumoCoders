import db from '../config/db.js';

const UserMutedWord = {
  async findByUser(userId) {
    return db('user_muted_words').where({ user_id: userId }).orderBy('created_at', 'desc');
  },

  async create(userId, pattern, isTag = false) {
    const [id] = await db('user_muted_words').insert({ user_id: userId, pattern: pattern.toLowerCase(), is_tag: isTag ? 1 : 0 });
    return db('user_muted_words').where({ id }).first();
  },

  async remove(id, userId) {
    return db('user_muted_words').where({ id, user_id: userId }).del();
  },

  async getMutedUserIds() {
    // Not needed for per-user filtering
  },
};

export default UserMutedWord;
