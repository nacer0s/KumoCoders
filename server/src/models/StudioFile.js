import db from '../config/db.js';

const StudioFile = {
  async create(data) {
    const [id] = await db('studio_files').insert({
      team_id: data.teamId,
      channel_id: data.channelId || null,
      user_id: data.userId,
      filename: data.filename,
      original_name: data.originalName,
      mime_type: data.mimeType || null,
      size_bytes: data.sizeBytes || 0,
      storage_path: data.storagePath || null,
    });
    return db('studio_files').where({ id }).first();
  },

  async findById(id) {
    return db('studio_files')
      .select(
        'studio_files.*',
        'users.display_name as uploader_name',
        'users.username as uploader_username'
      )
      .join('users', 'studio_files.user_id', 'users.id')
      .where('studio_files.id', id)
      .first();
  },

  async findByTeam(teamId, channelId) {
    const query = db('studio_files')
      .select(
        'studio_files.*',
        'users.display_name as uploader_name',
        'users.username as uploader_username'
      )
      .join('users', 'studio_files.user_id', 'users.id')
      .where('studio_files.team_id', teamId);
    if (channelId) query.andWhere('studio_files.channel_id', channelId);
    return query.orderBy('studio_files.created_at', 'desc').limit(100);
  },

  async delete(id) {
    return db('studio_files').where({ id }).del();
  },
};

export default StudioFile;
