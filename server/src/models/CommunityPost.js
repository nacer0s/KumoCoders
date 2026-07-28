import db from '../config/db.js';

const POST_COLUMNS = [
  'community_posts.*',
  'users.username as author_username',
  'users.display_name as author_display_name',
  'users.avatar_url as author_avatar_url',
  'users.created_at as author_created_at',
  'users.is_verified as author_is_verified',
  'users.role_id as author_role_id',
];

const CommunityPost = {
  async findAll({ page = 1, limit = 20, tag, search, sort = 'new', excludeUserIds, followingUserIds } = {}) {
    const offset = (page - 1) * limit;

    let countQuery = db('community_posts').where('status', 'published');
    if (tag) {
      countQuery = countQuery.where('tags', 'like', `%${tag}%`);
    }
    if (search) {
      countQuery = countQuery.where(function () {
        this.where('title', 'like', `%${search}%`)
          .orWhere('body', 'like', `%${search}%`);
      });
    }
    if (excludeUserIds && excludeUserIds.length > 0) {
      countQuery = countQuery.whereNotIn('user_id', excludeUserIds);
    }
    if (followingUserIds && followingUserIds.length > 0) {
      countQuery = countQuery.whereIn('user_id', followingUserIds);
    }
    const [{ count }] = await countQuery.count('* as count');

    let query = db('community_posts')
      .select(POST_COLUMNS)
      .join('users', 'community_posts.user_id', 'users.id')
      .where('community_posts.status', 'published');

    if (tag) {
      query = query.where('community_posts.tags', 'like', `%${tag}%`);
    }

    if (search) {
      query = query.where(function () {
        this.where('community_posts.title', 'like', `%${search}%`)
          .orWhere('community_posts.body', 'like', `%${search}%`);
      });
    }

    if (excludeUserIds && excludeUserIds.length > 0) {
      query = query.whereNotIn('community_posts.user_id', excludeUserIds);
    }

    if (followingUserIds && followingUserIds.length > 0) {
      query = query.whereIn('community_posts.user_id', followingUserIds);
    }

    if (sort === 'top') {
      query = query.orderBy('community_posts.like_count', 'desc');
    } else if (sort === 'hot') {
      query = query.orderByRaw(
        '(community_posts.like_count + community_posts.comment_count) / GREATEST(TIMESTAMPDIFF(HOUR, community_posts.created_at, NOW()), 1) DESC'
      );
    } else {
      query = query.orderBy('community_posts.created_at', 'desc');
    }

    query = query.orderBy('community_posts.is_pinned', 'desc');

    const posts = await query.limit(limit).offset(offset);

    return { posts, total: count, page, limit, pages: Math.ceil(count / limit) };
  },

  async findPinned(excludeUserIds) {
    let query = db('community_posts')
      .select(POST_COLUMNS)
      .join('users', 'community_posts.user_id', 'users.id')
      .where('community_posts.is_pinned', 1)
      .where('community_posts.status', 'published');

    if (excludeUserIds && excludeUserIds.length > 0) {
      query = query.whereNotIn('community_posts.user_id', excludeUserIds);
    }

    return query.orderBy('community_posts.created_at', 'desc');
  },

  async findById(id) {
    return db('community_posts')
      .select(POST_COLUMNS)
      .join('users', 'community_posts.user_id', 'users.id')
      .where('community_posts.id', id)
      .first();
  },

  async create(data) {
    const [id] = await db('community_posts').insert({
      user_id: data.userId,
      title: data.title,
      body: data.body,
      tags: data.tags || null,
      status: data.status || 'published',
    });
    return this.findById(id);
  },

  async update(id, data) {
    const updates = {};
    if (data.title !== undefined) updates.title = data.title;
    if (data.body !== undefined) updates.body = data.body;
    if (data.tags !== undefined) updates.tags = data.tags;
    if (data.is_pinned !== undefined) updates.is_pinned = data.is_pinned;
    if (data.status !== undefined) updates.status = data.status;
    await db('community_posts').where({ id }).update(updates);
    return this.findById(id);
  },

  async delete(id) {
    return db('community_posts').where({ id }).del();
  },

  async findByUserId(userId, { page = 1, limit = 20, status } = {}) {
    const offset = (page - 1) * limit;
    let countQuery = db('community_posts').where({ user_id: userId });
    if (status) countQuery = countQuery.where({ status });
    const [{ count }] = await countQuery.count('* as count');
    let postsQuery = db('community_posts')
      .select(POST_COLUMNS)
      .join('users', 'community_posts.user_id', 'users.id')
      .where('community_posts.user_id', userId);
    if (status) postsQuery = postsQuery.where('community_posts.status', status);
    const posts = await postsQuery
      .orderBy('community_posts.created_at', 'desc')
      .limit(limit)
      .offset(offset);
    return { posts, total: count };
  },

  async findDraftsByUserId(userId) {
    return db('community_posts')
      .select(POST_COLUMNS)
      .join('users', 'community_posts.user_id', 'users.id')
      .where('community_posts.user_id', userId)
      .where('community_posts.status', 'draft')
      .orderBy('community_posts.updated_at', 'desc');
  },

  async findLikedByUserId(userId, { page = 1, limit = 20 } = {}) {
    const offset = (page - 1) * limit;
    const { count } = await db('community_likes')
      .where({ user_id: userId, target_type: 'post' })
      .countDistinct('target_id as count')
      .first() || { count: 0 };
    const posts = await db('community_likes')
      .select(POST_COLUMNS)
      .join('community_posts', 'community_likes.target_id', 'community_posts.id')
      .join('users', 'community_posts.user_id', 'users.id')
      .where('community_likes.user_id', userId)
      .where('community_likes.target_type', 'post')
      .where('community_posts.status', 'published')
      .orderBy('community_likes.created_at', 'desc')
      .limit(limit)
      .offset(offset);
    return { posts, total: count };
  },
};

export default CommunityPost;
