import db from '../config/db.js';

const StudioChannel = {
  async create(data) {
    const [id] = await db('studio_channels').insert({
      team_id: data.teamId,
      name: data.name,
      type: data.type || 'chat',
      is_private: data.isPrivate || 0,
      created_by: data.createdBy || null,
    });
    return db('studio_channels').where({ id }).first();
  },

  async findById(id) {
    return db('studio_channels').where({ id }).first();
  },

  async findByTeam(teamId, type) {
    const query = db('studio_channels').where({ team_id: teamId });
    if (type) query.andWhere({ type });
    return query.orderBy('name');
  },

  async update(id, data) {
    await db('studio_channels').where({ id }).update(data);
    return db('studio_channels').where({ id }).first();
  },

  async delete(id) {
    return db('studio_channels').where({ id }).del();
  },
};

export default StudioChannel;
