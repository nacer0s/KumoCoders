import db from '../config/db.js';

const CommunityBlock = {
  async block(blockerId, blockedId) {
    const [id] = await db('community_blocks')
      .insert({ blocker_id: blockerId, blocked_id: blockedId })
      .onConflict(['blocker_id', 'blocked_id'])
      .ignore();
    return !!id;
  },

  async unblock(blockerId, blockedId) {
    const deleted = await db('community_blocks')
      .where({ blocker_id: blockerId, blocked_id: blockedId })
      .del();
    return deleted > 0;
  },

  async isBlocked(blockerId, blockedId) {
    const row = await db('community_blocks')
      .where({ blocker_id: blockerId, blocked_id: blockedId })
      .first();
    return !!row;
  },

  /** Get set of user IDs blocked by this user */
  async getBlockedUserIds(blockerId) {
    const rows = await db('community_blocks')
      .where({ blocker_id: blockerId })
      .select('blocked_id');
    return new Set(rows.map((r) => r.blocked_id));
  },

  /** Get set of user IDs who have blocked this user */
  async getBlockedByUserIds(userId) {
    const rows = await db('community_blocks')
      .where({ blocked_id: userId })
      .select('blocker_id');
    return new Set(rows.map((r) => r.blocker_id));
  },

  /** Get paginated list of blocked users with profile info */
  async getBlockedList(blockerId, { page = 1, limit = 20 }) {
    const [{ count }] = await db('community_blocks')
      .where({ blocker_id: blockerId })
      .count('* as count');

    const blocked = await db('community_blocks')
      .select(
        'community_blocks.*',
        'users.id as blocked_user_id',
        'users.username',
        'users.display_name',
        'users.avatar_url',
        'users.is_verified'
      )
      .join('users', 'community_blocks.blocked_id', 'users.id')
      .where('community_blocks.blocker_id', blockerId)
      .orderBy('community_blocks.created_at', 'desc')
      .offset((page - 1) * limit)
      .limit(limit);

    return { blocked, total: count, page, limit };
  },
};

export default CommunityBlock;
