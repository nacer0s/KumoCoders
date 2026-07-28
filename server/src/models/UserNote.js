import db from '../config/db.js';

const UserNote = {
  async findByUser(userId) {
    return db('user_notes')
      .select('user_notes.*', 'author.username as author_username', 'author.display_name as author_display_name')
      .join('users as author', 'user_notes.author_id', 'author.id')
      .where('user_notes.user_id', userId)
      .orderBy('user_notes.created_at', 'desc');
  },

  async create(data) {
    const [id] = await db('user_notes').insert({
      user_id: data.userId,
      author_id: data.authorId,
      body: data.body,
    });
    return db('user_notes').where({ id }).first();
  },

  async update(id, body) {
    await db('user_notes').where({ id }).update({ body });
    return db('user_notes').where({ id }).first();
  },

  async remove(id) {
    return db('user_notes').where({ id }).del();
  },
};

export default UserNote;
