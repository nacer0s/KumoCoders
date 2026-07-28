import db from '../config/db.js';

const StudioEvent = {
  async create(data) {
    const [id] = await db('studio_events').insert({
      team_id: data.teamId,
      title: data.title,
      description: data.description || null,
      event_date: data.eventDate,
      start_time: data.startTime || null,
      end_time: data.endTime || null,
      all_day: data.allDay || 0,
      created_by: data.createdBy,
    });
    return db('studio_events')
      .select(
        'studio_events.*',
        'users.display_name as creator_name'
      )
      .join('users', 'studio_events.created_by', 'users.id')
      .where('studio_events.id', id)
      .first();
  },

  async findById(id) {
    return db('studio_events')
      .select(
        'studio_events.*',
        'users.display_name as creator_name'
      )
      .join('users', 'studio_events.created_by', 'users.id')
      .where('studio_events.id', id)
      .first();
  },

  async findByTeam(teamId, month, year) {
    const query = db('studio_events')
      .select(
        'studio_events.*',
        'users.display_name as creator_name'
      )
      .join('users', 'studio_events.created_by', 'users.id')
      .where('studio_events.team_id', teamId);
    if (month && year) {
      query.whereRaw('MONTH(event_date) = ? AND YEAR(event_date) = ?', [month, year]);
    }
    return query.orderBy('event_date').orderBy('start_time');
  },

  async update(id, data) {
    const updateData = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.eventDate !== undefined) updateData.event_date = data.eventDate;
    if (data.startTime !== undefined) updateData.start_time = data.startTime;
    if (data.endTime !== undefined) updateData.end_time = data.endTime;
    if (data.allDay !== undefined) updateData.all_day = data.allDay;
    await db('studio_events').where({ id }).update(updateData);
    return db('studio_events').where({ id }).first();
  },

  async delete(id) {
    return db('studio_events').where({ id }).del();
  },
};

export default StudioEvent;
