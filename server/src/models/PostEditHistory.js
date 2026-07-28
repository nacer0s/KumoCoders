import db from '../config/db.js';

const PostEditHistory = {
  async findByPost(postId) {
    return db('post_edit_history')
      .select('post_edit_history.*', 'users.username as editor_username', 'users.display_name as editor_display_name')
      .join('users', 'post_edit_history.user_id', 'users.id')
      .where('post_edit_history.post_id', postId)
      .orderBy('post_edit_history.created_at', 'desc');
  },

  async create(data) {
    const [id] = await db('post_edit_history').insert({
      post_id: data.postId,
      user_id: data.userId,
      title: data.title,
      body: data.body,
      tags: data.tags || null,
    });
    return db('post_edit_history').where({ id }).first();
  },
};

export default PostEditHistory;
