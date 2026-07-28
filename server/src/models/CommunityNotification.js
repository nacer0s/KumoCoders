import db from '../config/db.js';

const CommunityNotification = {
  async create({ userId, type, message, link, actorId, postTitle, badgeName }) {
    const [id] = await db('community_notifications').insert({
      user_id: userId,
      type,
      message,
      link: link || null,
    });

    try {
      const { sendNotificationEmail } = await import('../utils/email.js');
      sendNotificationEmail({ userId, type, actorId, postTitle, badgeName });
    } catch { /* email errors non-fatal */ }

    return this.findById(id);
  },

  async findById(id) {
    return db('community_notifications').where({ id }).first();
  },

  async findByUserId(userId, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const [{ count }] = await db('community_notifications')
      .where({ user_id: userId })
      .count('* as count');

    const notifications = await db('community_notifications')
      .where({ user_id: userId })
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return { notifications, total: count, page, limit };
  },

  async getUnreadCount(userId) {
    const [{ count }] = await db('community_notifications')
      .where({ user_id: userId, is_read: 0 })
      .count('* as count');
    return count;
  },

  async markRead(id, userId) {
    await db('community_notifications')
      .where({ id, user_id: userId })
      .update({ is_read: 1, seen_at: db.fn.now() });
  },

  async markAllRead(userId) {
    await db('community_notifications')
      .where({ user_id: userId, is_read: 0 })
      .update({ is_read: 1, seen_at: db.fn.now() });
  },
};

export default CommunityNotification;
