import db from '../config/db.js';

const StudioAppData = {
  async findAll(teamId, appKey) {
    return db('studio_app_data')
      .select('studio_app_data.*', 'users.display_name as author_name', 'users.username as author_username')
      .leftJoin('users', 'studio_app_data.created_by', 'users.id')
      .where({ team_id: teamId, app_key: appKey })
      .orderBy('studio_app_data.updated_at', 'desc');
  },

  async findById(id) {
    return db('studio_app_data')
      .select('studio_app_data.*', 'users.display_name as author_name', 'users.username as author_username')
      .leftJoin('users', 'studio_app_data.created_by', 'users.id')
      .where('studio_app_data.id', id)
      .first();
  },

  async create(data) {
    const [id] = await db('studio_app_data').insert({
      team_id: data.teamId,
      app_key: data.appKey,
      item_key: data.itemKey || '',
      data: data.appData ? JSON.stringify(data.appData) : '{}',
      created_by: data.createdBy,
    });
    return db('studio_app_data').where({ id }).first();
  },

  async update(id, data) {
    const updateData = {};
    if (data.itemKey !== undefined) updateData.item_key = data.itemKey;
    if (data.appData !== undefined) updateData.data = JSON.stringify(data.appData);
    updateData.updated_at = db.fn.now();
    await db('studio_app_data').where({ id }).update(updateData);
    return db('studio_app_data').where({ id }).first();
  },

  async delete(id) {
    return db('studio_app_data').where({ id }).del();
  },
};

export default StudioAppData;
