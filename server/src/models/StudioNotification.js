import db from '../config/db.js';

const StudioNotification = {
  async findByUser(teamId, userId) {
    return db('studio_notifications')
      .where({ team_id: teamId, user_id: userId })
      .orderBy('created_at', 'desc')
      .limit(100);
  },

  async unreadCount(teamId, userId) {
    const r = await db('studio_notifications')
      .where({ team_id: teamId, user_id: userId, is_read: false })
      .count('id as cnt').first();
    return r?.cnt || 0;
  },

  async create(data) {
    const [id] = await db('studio_notifications').insert({
      team_id: data.teamId, user_id: data.userId,
      app_key: data.appKey || '', type: data.type || 'info',
      title: data.title, body: data.body || '',
      link: data.link || '',
    });
    return db('studio_notifications').where({ id }).first();
  },

  async markRead(id, userId) {
    await db('studio_notifications').where({ id, user_id: userId }).update({ is_read: true });
  },

  async markAllRead(teamId, userId) {
    await db('studio_notifications').where({ team_id: teamId, user_id: userId, is_read: false }).update({ is_read: true });
  },
};

export default StudioNotification;
