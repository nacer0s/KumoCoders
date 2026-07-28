import db from '../config/db.js';

const StudioWhiteboard = {
  async create(data) {
    const [id] = await db('studio_whiteboards').insert({
      team_id: data.teamId,
      title: data.title || 'Untitled Board',
      elements: data.elements ? JSON.stringify(data.elements) : '[]',
      created_by: data.createdBy,
    });
    return db('studio_whiteboards').where({ id }).first();
  },

  async findById(id) {
    return db('studio_whiteboards')
      .select(
        'studio_whiteboards.*',
        'users.display_name as author_name',
        'users.username as author_username'
      )
      .leftJoin('users', 'studio_whiteboards.created_by', 'users.id')
      .where('studio_whiteboards.id', id)
      .first();
  },

  async findByTeam(teamId) {
    return db('studio_whiteboards')
      .select(
        'studio_whiteboards.*',
        'users.display_name as author_name',
        'users.username as author_username'
      )
      .leftJoin('users', 'studio_whiteboards.created_by', 'users.id')
      .where('studio_whiteboards.team_id', teamId)
      .orderBy('studio_whiteboards.updated_at', 'desc');
  },

  async update(id, data) {
    const updateData = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.elements !== undefined) updateData.elements = JSON.stringify(data.elements);
    await db('studio_whiteboards').where({ id }).update(updateData);
    return db('studio_whiteboards').where({ id }).first();
  },

  async delete(id) {
    return db('studio_whiteboards').where({ id }).del();
  },
};

export default StudioWhiteboard;
