import db from '../config/db.js';

const CommunityBookmark = {
  async toggle(userId, postId) {
    const existing = await db('community_bookmarks')
      .where({ user_id: userId, post_id: postId })
      .first();

    if (existing) {
      await db('community_bookmarks').where({ id: existing.id }).del();
      return { bookmarked: false };
    } else {
      await db('community_bookmarks').insert({ user_id: userId, post_id: postId });
      return { bookmarked: true };
    }
  },

  async findByUserId(userId, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const [{ count }] = await db('community_bookmarks')
      .where({ user_id: userId })
      .count('* as count');

    const rows = await db('community_bookmarks')
      .select(
        'community_bookmarks.*',
        'community_posts.*',
        'users.username as author_username',
        'users.display_name as author_display_name'
      )
      .join('community_posts', 'community_bookmarks.post_id', 'community_posts.id')
      .join('users', 'community_posts.user_id', 'users.id')
      .where('community_bookmarks.user_id', userId)
      .orderBy('community_bookmarks.created_at', 'desc')
      .limit(limit)
      .offset(offset);

    return { posts: rows, total: count, page, limit };
  },

  async userBookmarks(userId, postIds) {
    if (!postIds.length) return new Set();
    const rows = await db('community_bookmarks')
      .select('post_id')
      .where({ user_id: userId })
      .whereIn('post_id', postIds);
    return new Set(rows.map((r) => r.post_id));
  },
};

export default CommunityBookmark;
