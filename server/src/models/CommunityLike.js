import db from '../config/db.js';

const CommunityLike = {
  /**
   * Toggle a like. Returns { liked: boolean, likeCount: number }
   */
  async toggle(userId, targetType, targetId) {
    const existing = await db('community_likes')
      .where({ user_id: userId, target_type: targetType, target_id: targetId })
      .first();

    if (existing) {
      // Unlike
      await db('community_likes').where({ id: existing.id }).del();
      const column = targetType === 'post' ? 'community_posts' : 'community_comments';
      await db(column).where({ id: targetId }).decrement('like_count', 1);
      const [{ likeCount }] = await db(column)
        .select('like_count as likeCount')
        .where({ id: targetId });
      return { liked: false, likeCount };
    } else {
      // Like
      await db('community_likes').insert({
        user_id: userId,
        target_type: targetType,
        target_id: targetId,
      });
      const column = targetType === 'post' ? 'community_posts' : 'community_comments';
      await db(column).where({ id: targetId }).increment('like_count', 1);
      const [{ likeCount }] = await db(column)
        .select('like_count as likeCount')
        .where({ id: targetId });
      return { liked: true, likeCount };
    }
  },

  /**
   * Check which items a user has liked.
   * @param {number} userId
   * @param {string} targetType - 'post' or 'comment'
   * @param {number[]} targetIds
   * @returns {Promise<Set<number>>} Set of liked target IDs
   */
  async userLikes(userId, targetType, targetIds) {
    if (!targetIds.length) return new Set();
    const rows = await db('community_likes')
      .select('target_id')
      .where({ user_id: userId, target_type: targetType })
      .whereIn('target_id', targetIds);
    return new Set(rows.map((r) => r.target_id));
  },

  async count(targetType, targetId) {
    const [{ count }] = await db('community_likes')
      .where({ target_type: targetType, target_id: targetId })
      .count('* as count');
    return count;
  },
};

export default CommunityLike;
