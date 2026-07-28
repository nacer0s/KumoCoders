import db from '../config/db.js';

const CommunityFollow = {
  async follow(followerId, followingId) {
    const [id] = await db('community_follows')
      .insert({ follower_id: followerId, following_id: followingId })
      .onConflict(['follower_id', 'following_id'])
      .ignore();
    return id ? { followed: true } : { followed: false };
  },

  async unfollow(followerId, followingId) {
    const deleted = await db('community_follows')
      .where({ follower_id: followerId, following_id: followingId })
      .del();
    return { followed: false, deleted: deleted > 0 };
  },

  async isFollowing(followerId, followingId) {
    const row = await db('community_follows')
      .where({ follower_id: followerId, following_id: followingId })
      .first();
    return !!row;
  },

  async getFollowers(userId, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const [{ count }] = await db('community_follows')
      .where({ following_id: userId })
      .count('* as count');
    const followers = await db('community_follows')
      .join('users', 'community_follows.follower_id', 'users.id')
      .where('community_follows.following_id', userId)
      .select(
        'users.id',
        'users.username',
        'users.display_name',
        'users.avatar_url',
        'users.is_verified',
        'users.role_id',
        'users.created_at as joined_at',
        'community_follows.created_at as followed_at'
      )
      .orderBy('community_follows.created_at', 'desc')
      .limit(limit)
      .offset(offset);
    return { followers, total: count, page, limit, pages: Math.ceil(count / limit) };
  },

  async getFollowing(userId, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const [{ count }] = await db('community_follows')
      .where({ follower_id: userId })
      .count('* as count');
    const following = await db('community_follows')
      .join('users', 'community_follows.following_id', 'users.id')
      .where('community_follows.follower_id', userId)
      .select(
        'users.id',
        'users.username',
        'users.display_name',
        'users.avatar_url',
        'users.is_verified',
        'users.role_id',
        'users.created_at as joined_at',
        'community_follows.created_at as followed_at'
      )
      .orderBy('community_follows.created_at', 'desc')
      .limit(limit)
      .offset(offset);
    return { following, total: count, page, limit, pages: Math.ceil(count / limit) };
  },

  async getFollowerCount(userId) {
    const [{ count }] = await db('community_follows')
      .where({ following_id: userId })
      .count('* as count');
    return count;
  },

  async getFollowingCount(userId) {
    const [{ count }] = await db('community_follows')
      .where({ follower_id: userId })
      .count('* as count');
    return count;
  },
};

export default CommunityFollow;
