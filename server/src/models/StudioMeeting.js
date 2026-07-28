import db from '../config/db.js';

const StudioMeeting = {
  async create(data) {
    const [id] = await db('studio_meetings').insert({
      team_id: data.teamId,
      channel_id: data.channelId || null,
      title: data.title || null,
      type: data.type || 'instant',
      status: 'active',
      started_by: data.startedBy,
    });
    return db('studio_meetings').where({ id }).first();
  },

  async findById(id) {
    return db('studio_meetings')
      .select(
        'studio_meetings.*',
        'users.display_name as started_by_name',
        'users.username as started_by_username'
      )
      .join('users', 'studio_meetings.started_by', 'users.id')
      .where('studio_meetings.id', id)
      .first();
  },

  async findActiveByTeam(teamId) {
    return db('studio_meetings')
      .select(
        'studio_meetings.*',
        'users.display_name as started_by_name',
        'users.username as started_by_username'
      )
      .join('users', 'studio_meetings.started_by', 'users.id')
      .where('studio_meetings.team_id', teamId)
      .andWhere('studio_meetings.status', 'active')
      .orderBy('studio_meetings.started_at', 'desc');
  },

  async end(id) {
    await db('studio_meetings').where({ id }).update({
      status: 'ended',
      ended_at: db.fn.now(),
    });
    return db('studio_meetings').where({ id }).first();
  },
};

export default StudioMeeting;
