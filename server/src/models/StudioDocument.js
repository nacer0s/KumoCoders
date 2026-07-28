import db from '../config/db.js';

const StudioDocument = {
  async create(data) {
    const [id] = await db('studio_documents').insert({
      team_id: data.teamId,
      title: data.title || 'Untitled',
      content: data.content || '',
      created_by: data.createdBy,
    });
    return db('studio_documents').where({ id }).first();
  },

  async findById(id) {
    return db('studio_documents')
      .select(
        'studio_documents.*',
        'users.display_name as author_name',
        'users.username as author_username'
      )
      .join('users', 'studio_documents.created_by', 'users.id')
      .where('studio_documents.id', id)
      .first();
  },

  async findByTeam(teamId) {
    return db('studio_documents')
      .select(
        'studio_documents.*',
        'users.display_name as author_name',
        'users.username as author_username'
      )
      .join('users', 'studio_documents.created_by', 'users.id')
      .where('studio_documents.team_id', teamId)
      .orderBy('studio_documents.updated_at', 'desc');
  },

  async update(id, data) {
    const updateData = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.content !== undefined) updateData.content = data.content;
    await db('studio_documents').where({ id }).update(updateData);
    return db('studio_documents').where({ id }).first();
  },

  async delete(id) {
    return db('studio_documents').where({ id }).del();
  },
};

export default StudioDocument;
