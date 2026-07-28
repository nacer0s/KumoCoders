import db from '../config/db.js';

const StudioMessage = {
  async create(data) {
    const [id] = await db('studio_messages').insert({
      channel_id: data.channelId,
      user_id: data.userId,
      content: data.content,
      type: data.type || 'text',
      metadata: data.metadata ? JSON.stringify(data.metadata) : null,
    });
    return db('studio_messages')
      .select(
        'studio_messages.*',
        'users.username',
        'users.display_name',
        'users.avatar_url'
      )
      .join('users', 'studio_messages.user_id', 'users.id')
      .where('studio_messages.id', id)
      .first();
  },

  async findByChannel(channelId, page = 1, limit = 50) {
    const offset = (page - 1) * limit;
    const messages = await db('studio_messages')
      .select(
        'studio_messages.*',
        'users.username',
        'users.display_name',
        'users.avatar_url'
      )
      .join('users', 'studio_messages.user_id', 'users.id')
      .where('studio_messages.channel_id', channelId)
      .orderBy('studio_messages.id', 'desc')
      .limit(limit)
      .offset(offset);

    const countResult = await db('studio_messages')
      .where({ channel_id: channelId })
      .count('* as count')
      .first();

    return {
      messages: messages.reverse(),
      total: Number(countResult.count),
      page,
      limit,
    };
  },

  async delete(id) {
    return db('studio_messages').where({ id }).del();
  },
};

export default StudioMessage;
