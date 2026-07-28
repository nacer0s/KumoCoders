import db from '../config/db.js';

const UserWarning = {
  async findByUser(userId) {
    return db('user_warnings')
      .select('user_warnings.*', 'issuer.username as issued_by_username', 'issuer.display_name as issued_by_display_name')
      .join('users as issuer', 'user_warnings.issued_by', 'issuer.id')
      .where('user_warnings.user_id', userId)
      .orderBy('user_warnings.created_at', 'desc');
  },

  async create(data) {
    const [id] = await db('user_warnings').insert({
      user_id: data.userId,
      issued_by: data.issuedBy,
      reason: data.reason,
      expires_at: data.expiresAt || null,
    });
    return db('user_warnings').where({ id }).first();
  },

  async countActive(userId) {
    const [{ count }] = await db('user_warnings')
      .where('user_id', userId)
      .where(function () {
        this.whereNull('expires_at').orWhere('expires_at', '>', db.fn.now());
      })
      .count('* as count');
    return count;
  },
};

export default UserWarning;
