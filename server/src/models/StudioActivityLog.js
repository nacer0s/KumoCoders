import db from '../config/db.js';

const StudioActivityLog = {
  async findByTeam(teamId, limit = 200) {
    return db('studio_activity_log')
      .select('studio_activity_log.*', 'users.display_name as user_name', 'users.username as user_username')
      .leftJoin('users', 'studio_activity_log.user_id', 'users.id')
      .where('studio_activity_log.team_id', teamId)
      .orderBy('studio_activity_log.created_at', 'desc')
      .limit(limit);
  },

  async create(data) {
    const [id] = await db('studio_activity_log').insert({
      team_id: data.teamId, user_id: data.userId || null,
      app_key: data.appKey || '', action: data.action || '',
      description: data.description || '',
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
    });
    return id;
  },
};

export default StudioActivityLog;
