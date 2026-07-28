import db from '../config/db.js';

const CommunityPostReaction = {
  async toggle(userId, postId, reaction) {
    const existing = await db('post_reactions')
      .where({ user_id: userId, post_id: postId, reaction })
      .first();

    if (existing) {
      await db('post_reactions').where({ id: existing.id }).del();
      return { reacted: false, reaction };
    }

    await db('post_reactions').insert({ user_id: userId, post_id: postId, reaction });
    return { reacted: true, reaction };
  },

  async getForPost(postId) {
    const rows = await db('post_reactions')
      .select('reaction')
      .count('* as count')
      .where({ post_id: postId })
      .groupBy('reaction')
      .orderBy('count', 'desc');
    return rows.map((r) => ({ reaction: r.reaction, count: Number(r.count) }));
  },

  async getForPosts(postIds) {
    if (!postIds.length) return [];
    return await db('post_reactions')
      .select('post_id', 'reaction')
      .count('* as count')
      .whereIn('post_id', postIds)
      .groupBy('post_id', 'reaction')
      .orderBy('count', 'desc');
  },

  async userReactions(userId, postIds) {
    if (!postIds.length) return {};
    const rows = await db('post_reactions')
      .select('post_id', 'reaction')
      .where({ user_id: userId })
      .whereIn('post_id', postIds);
    const map = {};
    for (const r of rows) {
      if (!map[r.post_id]) map[r.post_id] = [];
      map[r.post_id].push(r.reaction);
    }
    return map;
  },
};

export default CommunityPostReaction;
