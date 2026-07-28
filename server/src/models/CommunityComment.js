import db from '../config/db.js';

const COMMENT_COLUMNS = [
  'community_comments.*',
  'users.username as author_username',
  'users.display_name as author_display_name',
  'users.avatar_url as author_avatar_url',
  'users.is_verified as author_is_verified',
  'users.role_id as author_role_id',
];

const CommunityComment = {
  async findByPostId(postId) {
    return db('community_comments')
      .select(COMMENT_COLUMNS)
      .join('users', 'community_comments.user_id', 'users.id')
      .where('community_comments.post_id', postId)
      .orderBy('community_comments.created_at', 'asc');
  },

  async create(data) {
    const [id] = await db('community_comments').insert({
      post_id: data.postId,
      user_id: data.userId,
      body: data.body,
    });

    // Update comment count on post
    await db('community_posts')
      .where({ id: data.postId })
      .increment('comment_count', 1);

    return db('community_comments')
      .select(COMMENT_COLUMNS)
      .join('users', 'community_comments.user_id', 'users.id')
      .where('community_comments.id', id)
      .first();
  },

  async update(id, data) {
    await db('community_comments').where({ id }).update({
      body: data.body,
      updated_at: db.fn.now(),
    });

    return db('community_comments')
      .select(COMMENT_COLUMNS)
      .join('users', 'community_comments.user_id', 'users.id')
      .where('community_comments.id', id)
      .first();
  },

  async delete(id) {
    const comment = await db('community_comments').where({ id }).first();
    if (!comment) return null;

    await db('community_comments').where({ id }).del();

    // Decrement comment count on post
    await db('community_posts')
      .where({ id: comment.post_id })
      .decrement('comment_count', 1);

    return comment;
  },
};

export default CommunityComment;
