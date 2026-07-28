import { Router } from 'express';
import { z } from 'zod';
import CommunityPost from '../models/CommunityPost.js';
import CommunityComment from '../models/CommunityComment.js';
import CommunityLike from '../models/CommunityLike.js';
import CommunityBookmark from '../models/CommunityBookmark.js';
import CommunityNotification from '../models/CommunityNotification.js';
import CommunityBadge from '../models/CommunityBadge.js';
import CommunityPoll from '../models/CommunityPoll.js';
import CommunityFollow from '../models/CommunityFollow.js';
import CommunityReport from '../models/CommunityReport.js';
import CommunityBlock from '../models/CommunityBlock.js';
import CommunityPostReaction from '../models/CommunityPostReaction.js';
import db from '../config/db.js';
import User from '../models/User.js';
import { verifyToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';
import { processMentions } from '../utils/mentions.js';

const router = Router();

// ─── Helpers ──────────────────────────────────────

/** Attach user like state to each post/comment */
async function attachLikes(user, items, targetType) {
  if (!user || !items.length) return;
  const ids = items.map((i) => i.id);
  const likedSet = await CommunityLike.userLikes(user.id, targetType, ids);
  for (const item of items) {
    item.liked = likedSet.has(item.id);
  }
}

/** Attach bookmark state to posts */
async function attachBookmarks(user, posts) {
  if (!user || !posts.length) return;
  const ids = posts.map((p) => p.id);
  const bookmarkedSet = await CommunityBookmark.userBookmarks(user.id, ids);
  for (const post of posts) {
    post.bookmarked = bookmarkedSet.has(post.id);
  }
}

/** Attach reaction counts + user reactions to posts */
async function attachReactions(user, posts) {
  if (!posts.length) return;
  const ids = posts.map((p) => p.id);
  const allRows = await CommunityPostReaction.getForPosts(ids);
  const byPost = {};
  for (const row of allRows) {
    if (!byPost[row.post_id]) byPost[row.post_id] = [];
    byPost[row.post_id].push({ reaction: row.reaction, count: Number(row.count) });
  }
  for (const post of posts) {
    post.reactions = byPost[post.id] || [];
  }
  if (user) {
    const userRxs = await CommunityPostReaction.userReactions(user.id, ids);
    for (const post of posts) {
      post.user_reactions = userRxs[post.id] || [];
    }
  }
}

const postSchema = z.object({
  title: z.string().min(1).max(255),
  body: z.string().min(1),
  tags: z.string().max(500).optional(),
  status: z.enum(['draft', 'published']).optional(),
});

const commentSchema = z.object({
  body: z.string().min(1),
});

// ══════════════════════════════════════════════════
//  ADMIN
// ══════════════════════════════════════════════════

// GET /api/community/admin/all — List all posts (admin only)
router.get('/admin/all', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const result = await CommunityPost.findAll({
      page: parseInt(page) || 1,
      limit: Math.min(parseInt(limit) || 50, 100),
    });
    res.json(result);
  } catch (err) {
    console.error('Admin list posts error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/community/admin/pin/:id — Toggle pin (admin only)
router.put('/admin/pin/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const updated = await CommunityPost.update(req.params.id, {
      is_pinned: post.is_pinned ? 0 : 1,
    });
    res.json({ post: updated });
  } catch (err) {
    console.error('Toggle pin error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/community/admin/:id — Delete any post (admin only)
router.delete('/admin/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    await CommunityPost.delete(req.params.id);
    res.json({ message: 'Post deleted' });
  } catch (err) {
    console.error('Admin delete post error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ══════════════════════════════════════════════════
//  POSTS
// ══════════════════════════════════════════════════

// GET /api/community/posts — List posts (public)
router.get('/posts', async (req, res) => {
  try {
    const { page, limit, tag, search, sort, following } = req.query;

    // Get blocked + muted user IDs if logged in
    let excludeUserIds = [];
    let followingUserIds = null;
    if (req.headers.authorization) {
      try {
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.default.verify(
          req.headers.authorization.split(' ')[1],
          process.env.JWT_SECRET || 'kumocoders-dev-secret-change-in-production'
        );
        const CommunityBlock = (await import('../models/CommunityBlock.js')).default;
        const blockedSet = await CommunityBlock.getBlockedUserIds(decoded.id);
        excludeUserIds = [...blockedSet];
        const mutedRows = await db('community_muted_users').where({ user_id: decoded.id }).select('muted_user_id');
        for (const r of mutedRows) {
          if (!excludeUserIds.includes(r.muted_user_id)) excludeUserIds.push(r.muted_user_id);
        }
        if (following === 'true') {
          const rows = await db('community_follows').where({ follower_id: decoded.id }).select('following_id');
          followingUserIds = rows.map(r => r.following_id);
        }
      } catch { /* ignore */ }
    }

    const result = await CommunityPost.findAll({
      page: parseInt(page) || 1,
      limit: Math.min(parseInt(limit) || 20, 50),
      tag,
      search,
      sort: sort || 'new',
      excludeUserIds,
      followingUserIds: followingUserIds && followingUserIds.length > 0 ? followingUserIds : undefined,
    });

    // Attach like + reaction + bookmark state if user is logged in
    let currentUserId = null;
    if (req.headers.authorization) {
      try {
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.default.verify(
          req.headers.authorization.split(' ')[1],
          process.env.JWT_SECRET || 'kumocoders-dev-secret-change-in-production'
        );
        currentUserId = decoded.id;
        await attachLikes(decoded, result.posts, 'post');
        await attachBookmarks(decoded, result.posts);
      } catch { /* token invalid — ignore */ }
    }
    await attachReactions(currentUserId ? { id: currentUserId } : null, result.posts);

    // Attach polls to posts
    try {
      const postIds = result.posts.map((p) => p.id);
      if (postIds.length > 0) {
        let userId = currentUserId;
        const pollMap = await CommunityPoll.findByPostIds(postIds, userId);
        for (const post of result.posts) {
          if (pollMap.has(post.id)) {
            post.poll = pollMap.get(post.id);
          }
        }
      }
    } catch { /* ignore poll errors */ }

    res.json(result);
  } catch (err) {
    console.error('List posts error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/community/posts/pinned — Pinned posts (public)
router.get('/posts/pinned', async (req, res) => {
  try {
    // Get blocked user IDs if logged in
    let excludeUserIds = [];
    if (req.headers.authorization) {
      try {
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.default.verify(
          req.headers.authorization.split(' ')[1],
          process.env.JWT_SECRET || 'kumocoders-dev-secret-change-in-production'
        );
        const CommunityBlock = (await import('../models/CommunityBlock.js')).default;
        const blockedSet = await CommunityBlock.getBlockedUserIds(decoded.id);
        excludeUserIds = [...blockedSet];
      } catch { /* ignore */ }
    }

    const posts = await CommunityPost.findPinned(excludeUserIds);

    // Attach like/bookmark/reaction state if user is logged in
    if (req.headers.authorization && posts.length > 0) {
      try {
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.default.verify(
          req.headers.authorization.split(' ')[1],
          process.env.JWT_SECRET || 'kumocoders-dev-secret-change-in-production'
        );
        await attachLikes(decoded, posts, 'post');
        await attachBookmarks(decoded, posts);
        await attachReactions(decoded, posts);
      } catch { /* ignore */ }
    }

    // Attach polls to pinned posts
    try {
      const postIds = posts.map((p) => p.id);
      if (postIds.length > 0) {
        let userId = null;
        if (req.headers.authorization) {
          try {
            const jwt = await import('jsonwebtoken');
            const decoded = jwt.default.verify(
              req.headers.authorization.split(' ')[1],
              process.env.JWT_SECRET || 'kumocoders-dev-secret-change-in-production'
            );
            userId = decoded.id;
          } catch { /* ignore */ }
        }
        const pollMap = await CommunityPoll.findByPostIds(postIds, userId);
        for (const post of posts) {
          if (pollMap.has(post.id)) {
            post.poll = pollMap.get(post.id);
          }
        }
      }
    } catch { /* ignore poll errors */ }

    res.json({ posts });
  } catch (err) {
    console.error('Pinned posts error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/community/posts/trending-tags — Trending tags (public)
router.get('/posts/trending-tags', async (req, res) => {
  try {
    const rows = await db('community_posts')
      .select('tags')
      .where('status', 'published')
      .whereNotNull('tags')
      .where('tags', '!=', '')
      .orderBy('created_at', 'desc')
      .limit(200);

    const tagCount = {};
    for (const row of rows) {
      const tags = row.tags.split(',').map((t) => t.trim().toLowerCase()).filter(Boolean);
      for (const tag of tags) {
        tagCount[tag] = (tagCount[tag] || 0) + 1;
      }
    }

    const sorted = Object.entries(tagCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([tag, count]) => ({ tag, count }));

    res.json({ tags: sorted });
  } catch (err) {
    console.error('Trending tags error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/community/posts/drafts — Get user's drafts (authenticated)
router.get('/posts/drafts', verifyToken, async (req, res) => {
  try {
    const drafts = await CommunityPost.findDraftsByUserId(req.user.id);
    res.json({ drafts });
  } catch (err) {
    console.error('Get drafts error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/community/posts/drafts/count — Draft count (authenticated)
router.get('/posts/drafts/count', verifyToken, async (req, res) => {
  try {
    const drafts = await CommunityPost.findDraftsByUserId(req.user.id);
    res.json({ count: drafts.length });
  } catch (err) {
    console.error('Draft count error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/community/posts — Create post (authenticated)
router.post('/posts', verifyToken, async (req, res) => {
  try {
    const data = postSchema.parse(req.body);
    const post = await CommunityPost.create({
      userId: req.user.id,
      title: data.title,
      body: data.body,
      tags: data.tags || null,
      status: data.status || 'published',
    });

	    // Word filter check
	    try {
	      const WordFilter = (await import('../models/WordFilter.js')).default;
	      const combined = `${data.title} ${data.body}`;
	      const result = await WordFilter.checkContent(combined);
	      if (result.blocked) {
	        await CommunityPost.delete(post.id);
	        return res.status(400).json({ error: 'Content blocked by filter', reason: result.reason });
	      }
	      if (result.flagged) {
	        const Notification = (await import('../models/CommunityNotification.js')).default;
	        await Notification.create({
	          userId: req.user.id, type: 'system',
	          message: 'Your post was flagged for review by automated filters.',
	          link: `/community/post/${post.id}`,
	        });
	      }
	    } catch { /* ignore filter errors */ }

	    // Check for badge awards
	    try {
	      const newBadges = await CommunityBadge.checkAndAward(req.user.id);
	      if (newBadges.length > 0) {
	        console.log(`Badges awarded to user ${req.user.id}:`, newBadges.map((b) => b.name));
	      }
	    } catch { /* ignore badge errors */ }

	    // Process @mentions in the post body
	    try {
	      await processMentions({
	        text: data.body,
	        authorId: req.user.id,
	        targetType: 'post',
	        targetId: post.id,
	        postTitle: data.title,
	      });
	    } catch { /* ignore mention errors */ }

	    // Create poll if included
    if (req.body.poll && req.body.poll.question && req.body.poll.options?.length >= 2) {
      try {
        const p = await CommunityPoll.create({
          postId: post.id,
          question: req.body.poll.question,
          options: req.body.poll.options.slice(0, 6),
          expiresAt: req.body.poll.expires_at || null,
        });
        post.poll = p;
      } catch (pollErr) {
        console.error('Poll creation failed:', pollErr.message);
        // Don't fail the post creation
      }
    }

    res.status(201).json({ post });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('Create post error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/community/posts/:id — Get post + comments (public)
router.get('/posts/:id', async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const comments = await CommunityComment.findByPostId(req.params.id);

    // Attach like state if user is logged in
    if (req.headers.authorization) {
      try {
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.default.verify(
          req.headers.authorization.split(' ')[1],
          process.env.JWT_SECRET || 'kumocoders-dev-secret-change-in-production'
        );
        await attachLikes(decoded, [post], 'post');
        await attachLikes(decoded, comments, 'comment');
        await attachBookmarks(decoded, [post]);
        await attachReactions(decoded, [post]);
      } catch { /* ignore */ }
    } else {
      await attachReactions(null, [post]);
    }

    res.json({ post, comments });
  } catch (err) {
    console.error('Get post error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/community/posts/:id — Edit post (owner or admin)
router.put('/posts/:id', verifyToken, async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    // Check ownership or admin
    if (post.user_id !== req.user.id && req.user.role !== 1) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const data = postSchema.partial().parse(req.body);

    // Save edit history
    try {
      const PostEditHistory = (await import('../models/PostEditHistory.js')).default;
      await PostEditHistory.create({
        postId: parseInt(req.params.id),
        userId: req.user.id,
        title: post.title,
        body: post.body,
        tags: post.tags,
      });
    } catch { /* ignore history errors */ }

    // Word filter check
    if (data.title || data.body) {
      try {
        const WordFilter = (await import('../models/WordFilter.js')).default;
        const combined = `${data.title || post.title} ${data.body || post.body}`;
        const result = await WordFilter.checkContent(combined);
        if (result.blocked) {
          return res.status(400).json({ error: 'Content blocked by filter', reason: result.reason });
        }
      } catch { /* ignore filter errors */ }
    }

    const updated = await CommunityPost.update(req.params.id, data);
    res.json({ post: updated });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('Update post error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/community/posts/:id — Delete post (owner or admin)
router.delete('/posts/:id', verifyToken, async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    if (post.user_id !== req.user.id && req.user.role !== 1) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await CommunityPost.delete(req.params.id);
    res.json({ message: 'Post deleted' });
  } catch (err) {
    console.error('Delete post error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ══════════════════════════════════════════════════
//  COMMENTS
// ══════════════════════════════════════════════════

// POST /api/community/posts/:id/comments — Add comment (authenticated)
router.post('/posts/:id/comments', verifyToken, async (req, res) => {
  try {
    const post = await CommunityPost.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    const data = commentSchema.parse(req.body);
    const comment = await CommunityComment.create({
      postId: parseInt(req.params.id),
      userId: req.user.id,
      body: data.body,
    });

	    // Notify post author
	    try {
	      if (post.user_id !== req.user.id) {
	        const Notification = (await import('../models/CommunityNotification.js')).default;
        await Notification.create({
          userId: post.user_id,
          type: 'comment',
          message: `${req.user.username} commented on your post`,
          link: `/community/post/${post.id}`,
          actorId: req.user.id,
          postTitle: post.title,
        });
	      }
	    } catch { /* ignore notification errors */ }

	    // Process @mentions in the comment body
	    try {
	      await processMentions({
	        text: data.body,
	        authorId: req.user.id,
	        targetType: 'comment',
	        targetId: comment.id,
	        postTitle: post.title,
	      });
	    } catch { /* ignore mention errors */ }

	    res.status(201).json({ comment });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('Create comment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/community/comments/:id — Delete comment (owner or admin)
router.delete('/comments/:id', verifyToken, async (req, res) => {
  try {
    const comment = await CommunityComment.findByPostId(req.params.id);
    // We need the actual comment, so query it directly
    const db = (await import('../config/db.js')).default;
    const fullComment = await db('community_comments').where({ id: req.params.id }).first();
    if (!fullComment) return res.status(404).json({ error: 'Comment not found' });

    const post = await CommunityPost.findById(fullComment.post_id);
    if (fullComment.user_id !== req.user.id && req.user.role !== 1) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await CommunityComment.delete(req.params.id);
    res.json({ message: 'Comment deleted' });
  } catch (err) {
    console.error('Delete comment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/community/comments/:id — Edit comment (owner only)
router.put('/comments/:id', verifyToken, async (req, res) => {
  try {
    const db = (await import('../config/db.js')).default;
    const fullComment = await db('community_comments').where({ id: req.params.id }).first();
    if (!fullComment) return res.status(404).json({ error: 'Comment not found' });
    if (fullComment.user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const data = commentSchema.parse(req.body);
    const comment = await CommunityComment.update(req.params.id, data);
    res.json({ comment });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation failed', details: err.errors });
    }
    console.error('Edit comment error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ══════════════════════════════════════════════════
//  LIKES
// ══════════════════════════════════════════════════

// POST /api/community/like — Toggle like (authenticated)
router.post('/like', verifyToken, async (req, res) => {
  try {
    const { target_type, target_id } = req.body;

    if (!['post', 'comment'].includes(target_type)) {
      return res.status(400).json({ error: 'Invalid target_type' });
    }
    if (!target_id || isNaN(target_id)) {
      return res.status(400).json({ error: 'Invalid target_id' });
    }

    const result = await CommunityLike.toggle(req.user.id, target_type, parseInt(target_id));

    // Notify content owner on like (not on unlike)
    if (result.liked) {
      try {
        let ownerId = null;
        let link = null;
        if (target_type === 'post') {
          const p = await CommunityPost.findById(target_id);
          if (p && p.user_id !== req.user.id) {
            ownerId = p.user_id;
            link = `/community/post/${target_id}`;
          }
        } else {
          const db = (await import('../config/db.js')).default;
          const c = await db('community_comments').where({ id: target_id }).first();
          if (c && c.user_id !== req.user.id) {
            ownerId = c.user_id;
            link = `/community/post/${c.post_id}`;
          }
        }
        if (ownerId) {
          const Notification = (await import('../models/CommunityNotification.js')).default;
          await Notification.create({
            userId: ownerId,
            type: 'like',
            message: `${req.user.username} liked your ${target_type}`,
            link,
            actorId: req.user.id,
            postTitle: target_type === 'post' ? p?.title : undefined,
          });
        }
      } catch { /* ignore notification errors */ }
    }

    res.json(result);
  } catch (err) {
    console.error('Toggle like error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ══════════════════════════════════════════════════
//  TAGS
// ══════════════════════════════════════════════════

// GET /api/community/tags — List all used tags (public)
router.get('/tags', async (req, res) => {
  try {
    const rows = await CommunityPost.findAll({ limit: 1000 });
    const tagMap = {};
    for (const post of rows.posts) {
      if (post.tags) {
        for (const tag of post.tags.split(',').map((t) => t.trim()).filter(Boolean)) {
          tagMap[tag] = (tagMap[tag] || 0) + 1;
        }
      }
    }
    const tags = Object.entries(tagMap).map(([name, count]) => ({ name, count }));
    tags.sort((a, b) => b.count - a.count);
    res.json({ tags });
  } catch (err) {
    console.error('List tags error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ══════════════════════════════════════════════════
//  USER POSTS
// ══════════════════════════════════════════════════

// GET /api/community/users/search — Search users by username (public)
router.get('/users/search', async (req, res) => {
  try {
    const q = req.query.q || '';
    if (q.length < 1) return res.json({ users: [] });
    const User = (await import('../models/User.js')).default;
    const users = await User.searchByUsername(q, 10);
    res.json({ users });
  } catch (err) {
    console.error('Search users error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

// GET /api/community/users/followed — Get users the current user follows (for mention autocomplete)
router.get('/users/followed', verifyToken, async (req, res) => {
  try {
    const CommunityFollow = (await import('../models/CommunityFollow.js')).default;
    const result = await CommunityFollow.getFollowing(req.user.id, { limit: 50 });
    res.json({ users: result.following });
  } catch (err) {
    console.error('Followed users error:', err);
    res.status(500).json({ error: 'Failed to load followed users' });
  }
});

// GET /api/community/users/by-username/:username — Get user by username (public)
router.get('/users/by-username/:username', async (req, res) => {
  try {
    const User = (await import('../models/User.js')).default;
    const UserSettings = (await import('../models/UserSettings.js')).default;
    const user = await User.findByUsername(req.params.username);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Check profile visibility
    const settings = await UserSettings.get(user.id);
    if (settings.profile_visibility === 'private') {
      // Check if viewer is the owner
      let viewerId = null;
      if (req.headers.authorization) {
        try {
          const jwt = await import('jsonwebtoken');
          const decoded = jwt.default.verify(
            req.headers.authorization.split(' ')[1],
            process.env.JWT_SECRET || 'kumocoders-dev-secret-change-in-production'
          );
          viewerId = decoded.id;
        } catch {}
      }
      if (viewerId !== user.id) {
        const { password_hash, ...safeUser } = user;
        safeUser.profile_hidden = true;
        safeUser.bio = null;
        return res.json({ user: safeUser });
      }
    }

    // Remove online status if user disabled it (only for non-owners)
    if (!settings.show_online_status) {
      // The users table doesn't have an online_status column yet, so this is a no-op for now
    }

    const { password_hash, ...safeUser } = user;
    res.json({ user: safeUser });
  } catch (err) {
    console.error('Get user by username error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/community/users/:id/posts — User's posts (public)
router.get('/users/:id/posts', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const result = await CommunityPost.findByUserId(req.params.id, { page });

    // Attach like/bookmark/reaction state if user is logged in
    if (req.headers.authorization && result.posts.length > 0) {
      try {
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.default.verify(
          req.headers.authorization.split(' ')[1],
          process.env.JWT_SECRET || 'kumocoders-dev-secret-change-in-production'
        );
        await attachLikes(decoded, result.posts, 'post');
        await attachBookmarks(decoded, result.posts);
        await attachReactions(decoded, result.posts);
      } catch { /* ignore */ }
    } else {
      await attachReactions(null, result.posts);
    }

    res.json(result);
  } catch (err) {
    console.error('User posts error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/community/users/:id/liked-posts — Posts a user has liked (public)
router.get('/users/:id/liked-posts', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const result = await CommunityPost.findLikedByUserId(req.params.id, { page });

    // Attach like/bookmark/reaction state if user is logged in
    if (req.headers.authorization && result.posts.length > 0) {
      try {
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.default.verify(
          req.headers.authorization.split(' ')[1],
          process.env.JWT_SECRET || 'kumocoders-dev-secret-change-in-production'
        );
        await attachLikes(decoded, result.posts, 'post');
        await attachBookmarks(decoded, result.posts);
        await attachReactions(decoded, result.posts);
      } catch { /* ignore */ }
    } else {
      await attachReactions(null, result.posts);
    }

    res.json(result);
  } catch (err) {
    console.error('User liked posts error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/community/users/:id/saved-posts — Posts a user has bookmarked (public)
router.get('/users/:id/saved-posts', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const result = await CommunityBookmark.findByUserId(req.params.id, { page });

    // Attach like/reaction state if user is logged in
    if (req.headers.authorization && result.posts.length > 0) {
      try {
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.default.verify(
          req.headers.authorization.split(' ')[1],
          process.env.JWT_SECRET || 'kumocoders-dev-secret-change-in-production'
        );
        await attachLikes(decoded, result.posts, 'post');
        await attachReactions(decoded, result.posts);
      } catch { /* ignore */ }
    } else {
      await attachReactions(null, result.posts);
    }

    res.json(result);
  } catch (err) {
    console.error('User saved posts error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ══════════════════════════════════════════════════
//  BOOKMARKS
// ══════════════════════════════════════════════════

// POST /api/community/bookmarks/toggle — Toggle bookmark (authenticated)
router.post('/bookmarks/toggle', verifyToken, async (req, res) => {
  try {
    const { post_id } = req.body;
    if (!post_id || isNaN(post_id)) {
      return res.status(400).json({ error: 'Invalid post_id' });
    }
    const result = await CommunityBookmark.toggle(req.user.id, parseInt(post_id));
    res.json(result);
  } catch (err) {
    console.error('Toggle bookmark error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/community/bookmarks — Get user's bookmarks (authenticated)
router.get('/bookmarks', verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const result = await CommunityBookmark.findByUserId(req.user.id, { page });
    if (result.posts.length > 0) {
      await attachLikes(req.user, result.posts, 'post');
      await attachReactions(req.user, result.posts);
    }
    res.json(result);
  } catch (err) {
    console.error('List bookmarks error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ══════════════════════════════════════════════════
//  NOTIFICATIONS
// ══════════════════════════════════════════════════

// GET /api/community/notifications — List notifications (authenticated)
router.get('/notifications', verifyToken, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const result = await CommunityNotification.findByUserId(req.user.id, { page });
    res.json(result);
  } catch (err) {
    console.error('List notifications error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/community/notifications/count — Unread count (authenticated)
router.get('/notifications/count', verifyToken, async (req, res) => {
  try {
    const count = await CommunityNotification.getUnreadCount(req.user.id);
    res.json({ count });
  } catch (err) {
    console.error('Notification count error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/community/notifications/read/:id — Mark one as read (authenticated)
router.post('/notifications/read/:id', verifyToken, async (req, res) => {
  try {
    await CommunityNotification.markRead(parseInt(req.params.id), req.user.id);
    res.json({ message: 'Marked as read' });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/community/notifications/read-all — Mark all as read (authenticated)
router.post('/notifications/read-all', verifyToken, async (req, res) => {
  try {
    await CommunityNotification.markAllRead(req.user.id);
    res.json({ message: 'All marked as read' });
  } catch (err) {
    console.error('Mark all read error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ══════════════════════════════════════════════════
//  BADGES
// ══════════════════════════════════════════════════

// GET /api/community/badges/:userId — Get user's badges (public)
router.get('/badges/:userId', async (req, res) => {
  try {
    const badges = await CommunityBadge.getByUserId(parseInt(req.params.userId));
    res.json({ badges });
  } catch (err) {
    console.error('Get badges error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/community/badges/:userId/all — Get ALL badges with earned status + progress (public)
router.get('/badges/:userId/all', async (req, res) => {
  try {
    const badges = await CommunityBadge.getAllBadges(parseInt(req.params.userId));
    res.json({ badges });
  } catch (err) {
    console.error('Get all badges error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ══════════════════════════════════════════════════
//  POLLS
// ══════════════════════════════════════════════════

// POST /api/community/polls — Create poll for a post (authenticated)
router.post('/polls', verifyToken, async (req, res) => {
  try {
    const { post_id, question, options, expires_at } = req.body;

    if (!post_id || !question || !options || options.length < 2) {
      return res.status(400).json({ error: 'post_id, question, and at least 2 options required' });
    }
    if (options.length > 6) {
      return res.status(400).json({ error: 'Maximum 6 options allowed' });
    }

    // Verify post ownership
    const post = await CommunityPost.findById(post_id);
    if (!post) return res.status(404).json({ error: 'Post not found' });
    if (post.user_id !== req.user.id && req.user.role !== 1) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const poll = await CommunityPoll.create({
      postId: parseInt(post_id),
      question,
      options,
      expiresAt: expires_at || null,
    });

    res.status(201).json({ poll });
  } catch (err) {
    console.error('Create poll error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/community/polls/by-post/:postId — Get poll by post ID (public, optional token)
router.get('/polls/by-post/:postId', async (req, res) => {
  try {
    let userId = null;
    if (req.headers.authorization) {
      try {
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.default.verify(
          req.headers.authorization.split(' ')[1],
          process.env.JWT_SECRET || 'kumocoders-dev-secret-change-in-production'
        );
        userId = decoded.id;
      } catch { /* ignore */ }
    }

    const poll = await CommunityPoll.findByPostId(parseInt(req.params.postId));
    if (!poll) return res.status(404).json({ error: 'No poll for this post' });

    const results = await CommunityPoll.getResults(poll.id, userId);
    res.json({ poll: results });
  } catch (err) {
    console.error('Get poll by post error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/community/polls/:id — Get poll results (public, optional token)
router.get('/polls/:id', async (req, res) => {
  try {
    let userId = null;
    if (req.headers.authorization) {
      try {
        const jwt = await import('jsonwebtoken');
        const decoded = jwt.default.verify(
          req.headers.authorization.split(' ')[1],
          process.env.JWT_SECRET || 'kumocoders-dev-secret-change-in-production'
        );
        userId = decoded.id;
      } catch { /* ignore */ }
    }

    const results = await CommunityPoll.getResults(parseInt(req.params.id), userId);
    if (!results) return res.status(404).json({ error: 'Poll not found' });
    res.json({ poll: results });
  } catch (err) {
    console.error('Get poll error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/community/polls/:id/vote — Vote on a poll (authenticated)
router.post('/polls/:id/vote', verifyToken, async (req, res) => {
  try {
    const { option_id } = req.body;
    if (!option_id) return res.status(400).json({ error: 'option_id required' });

    const results = await CommunityPoll.vote(parseInt(req.params.id), parseInt(option_id), req.user.id);
    res.json({ poll: results });
  } catch (err) {
    if (err.message === 'Already voted') return res.status(409).json({ error: err.message });
    if (err.message === 'Poll has expired') return res.status(400).json({ error: err.message });
    if (err.message === 'Poll not found') return res.status(404).json({ error: err.message });
    if (err.message === 'Invalid option') return res.status(400).json({ error: err.message });
    console.error('Vote error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ══════════════════════════════════════════════════
//  FOLLOW SYSTEM
// ══════════════════════════════════════════════════

// POST /api/community/users/:id/follow — Follow/unfollow toggle (authenticated)
router.post('/users/:id/follow', verifyToken, async (req, res) => {
  try {
    const followingId = parseInt(req.params.id);
    const followerId = req.user.id;

    if (followerId === followingId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    const isCurrentlyFollowing = await CommunityFollow.isFollowing(followerId, followingId);

    let result;
    if (isCurrentlyFollowing) {
      result = await CommunityFollow.unfollow(followerId, followingId);
    } else {
      result = await CommunityFollow.follow(followerId, followingId);

      // Notify followed user
      try {
        const Notification = (await import('../models/CommunityNotification.js')).default;
        await Notification.create({
          userId: followingId,
          type: 'follow',
          message: `${req.user.username} started following you`,
          link: `/community/profile/${followerId}`,
          actorId: followerId,
        });
      } catch { /* ignore notification errors */ }
    }

    const followerCount = await CommunityFollow.getFollowerCount(followingId);

    res.json({
      following: !isCurrentlyFollowing,
      follower_count: followerCount,
    });
  } catch (err) {
    console.error('Toggle follow error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/community/users/:id/followers — List followers (public)
router.get('/users/:id/followers', async (req, res) => {
  try {
    const { page, limit } = req.query;
    const result = await CommunityFollow.getFollowers(parseInt(req.params.id), {
      page: parseInt(page) || 1,
      limit: Math.min(parseInt(limit) || 20, 50),
    });
    res.json(result);
  } catch (err) {
    console.error('List followers error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/community/users/:id/following — List following (public)
router.get('/users/:id/following', async (req, res) => {
  try {
    const { page, limit } = req.query;
    const result = await CommunityFollow.getFollowing(parseInt(req.params.id), {
      page: parseInt(page) || 1,
      limit: Math.min(parseInt(limit) || 20, 50),
    });
    res.json(result);
  } catch (err) {
    console.error('List following error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/community/users/:id/follow-status — Check follow status (authenticated)
router.get('/users/:id/follow-status', verifyToken, async (req, res) => {
  try {
    const isFollowing = await CommunityFollow.isFollowing(req.user.id, parseInt(req.params.id));
    const followerCount = await CommunityFollow.getFollowerCount(parseInt(req.params.id));
    const followingCount = await CommunityFollow.getFollowingCount(parseInt(req.params.id));
    res.json({ isFollowing, follower_count: followerCount, following_count: followingCount });
  } catch (err) {
    console.error('Follow status error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/community/users/:id/counts — Get follow + engagement counts (public)
router.get('/users/:id/counts', async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    const followerCount = await CommunityFollow.getFollowerCount(userId);
    const followingCount = await CommunityFollow.getFollowingCount(userId);

    // Total likes received on user's posts
    const [{ total_likes }] = await db('community_posts')
      .where({ user_id: userId })
      .sum('like_count as total_likes');

    // Total saves received on user's posts
    const [{ total_saves }] = await db('community_bookmarks')
      .join('community_posts', 'community_bookmarks.post_id', 'community_posts.id')
      .where('community_posts.user_id', userId)
      .count('* as total_saves');

    res.json({
      follower_count: followerCount,
      following_count: followingCount,
      total_likes: total_likes || 0,
      total_saves: total_saves || 0,
    });
  } catch (err) {
    console.error('Counts error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ══════════════════════════════════════════════════
//  ACCOUNT VERIFICATION (admin)
// ══════════════════════════════════════════════════

// PUT /api/community/admin/verify/:userId — Toggle verification (admin only)
router.put('/admin/verify/:userId', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const userId = parseInt(req.params.userId);
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    let updated;
    if (user.is_verified) {
      updated = await User.unverify(userId);
    } else {
      updated = await User.verify(userId, req.user.id);
    }

    // Create notification for the user
    try {
      if (updated.is_verified) {
        await CommunityNotification.create({
          userId,
          type: 'badge',
          message: 'Your account has been verified! You now have a verified badge on your profile.',
          link: `/community/profile/${userId}`,
          badgeName: 'Verified Account',
        });
      }
    } catch { /* ignore notification errors */ }

    res.json({ user: updated });
  } catch (err) {
    console.error('Toggle verification error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ══════════════════════════════════════════════════
//  MODERATION — Reports & Blocks
// ══════════════════════════════════════════════════

// POST /api/community/report — Submit a report (authenticated)
router.post('/report', verifyToken, async (req, res) => {
  try {
    const { target_type, target_id, reason } = req.body;
    if (!target_type || !target_id || !reason) {
      return res.status(400).json({ error: 'target_type, target_id, and reason are required' });
    }
    if (!['post', 'comment', 'user'].includes(target_type)) {
      return res.status(400).json({ error: 'Invalid target_type' });
    }

    const report = await CommunityReport.create({
      reporterId: req.user.id,
      targetType: target_type,
      targetId: parseInt(target_id),
      reason,
    });

    res.status(201).json({ report });
  } catch (err) {
    console.error('Create report error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/community/block/:userId — Block a user (authenticated)
router.post('/block/:userId', verifyToken, async (req, res) => {
  try {
    const blockedId = parseInt(req.params.userId);
    const blockerId = req.user.id;

    if (blockerId === blockedId) {
      return res.status(400).json({ error: 'Cannot block yourself' });
    }

    const blocked = await CommunityBlock.block(blockerId, blockedId);
    res.json({ blocked });
  } catch (err) {
    console.error('Block user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/community/unblock/:userId — Unblock a user (authenticated)
router.post('/unblock/:userId', verifyToken, async (req, res) => {
  try {
    const unblocked = await CommunityBlock.unblock(req.user.id, parseInt(req.params.userId));
    res.json({ unblocked });
  } catch (err) {
    console.error('Unblock user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/community/blocked — Get user's block list (authenticated)
router.get('/blocked', verifyToken, async (req, res) => {
  try {
    const { page } = req.query;
    const result = await CommunityBlock.getBlockedList(req.user.id, {
      page: parseInt(page) || 1,
    });
    res.json(result);
  } catch (err) {
    console.error('Get blocked list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/community/blocked/ids — Get IDs of users the current user has blocked (authenticated)
router.get('/blocked/ids', verifyToken, async (req, res) => {
  try {
    const blockedIds = await CommunityBlock.getBlockedUserIds(req.user.id);
    res.json({ blockedIds: [...blockedIds] });
  } catch (err) {
    console.error('Get blocked IDs error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/community/reports — List all reports (admin only)
router.get('/reports', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { status, page } = req.query;
    const result = await CommunityReport.findAll({
      status: status || null,
      page: parseInt(page) || 1,
    });
    res.json(result);
  } catch (err) {
    console.error('List reports error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/community/reports/my — Current user's reports
router.get('/reports/my', verifyToken, async (req, res) => {
  try {
    const result = await CommunityReport.getByReporterId(req.user.id, {
      page: parseInt(req.query.page) || 1,
      limit: 50,
    });
    res.json(result);
  } catch (err) {
    console.error('My reports error:', err);
    res.status(500).json({ error: 'Failed to fetch your reports' });
  }
});

// PUT /api/community/reports/:id/resolve — Resolve or dismiss a report (admin only)
router.put('/reports/:id/resolve', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { status, resolution_notes } = req.body;
    if (!['resolved', 'dismissed'].includes(status)) {
      return res.status(400).json({ error: 'Status must be "resolved" or "dismissed"' });
    }

    const report = await CommunityReport.updateStatus(parseInt(req.params.id), {
      status,
      reviewedBy: req.user.id,
      resolutionNotes: resolution_notes,
    });

    res.json({ report });
  } catch (err) {
    console.error('Resolve report error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ══════════════════════════════════════════════════
//  USER SETTINGS
// ══════════════════════════════════════════════════

import UserSettings from '../models/UserSettings.js';

// GET /api/community/settings — Get current user settings (authenticated)
router.get('/settings', verifyToken, async (req, res) => {
  try {
    const settings = await UserSettings.get(req.user.id);
    res.json({ settings });
  } catch (err) {
    console.error('Get settings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/community/settings — Update user settings (authenticated)
router.put('/settings', verifyToken, async (req, res) => {
  try {
    const allowed = [
      'profile_visibility', 'show_online_status', 'show_last_seen',
      'allow_follows', 'allow_dms', 'show_liked_posts', 'show_saved_posts',
      'nsfw_filter', 'feed_density', 'default_sort', 'posts_per_page',
      'show_preview_images', 'hide_downvoted_posts',
      'notify_likes', 'notify_comments', 'notify_mentions', 'notify_follows',
      'notify_badges', 'notify_system',
      'theme', 'font_size', 'reduce_motion', 'high_contrast', 'font_family',
      'two_factor_auth', 'login_alerts', 'session_timeout',
      'onboarding_complete',
    ];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    }
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid settings to update' });
    }
    const settings = await UserSettings.update(req.user.id, updates);
    res.json({ settings });
  } catch (err) {
    console.error('Update settings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/community/settings/public/:userId — Get public visibility info for profile viewing
router.get('/settings/public/:userId', async (req, res) => {
  try {
    const settings = await UserSettings.get(parseInt(req.params.userId));
    res.json({
      profile_visibility: settings.profile_visibility,
      show_online_status: settings.show_online_status,
    });
  } catch (err) {
    console.error('Get public settings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ══════════════════════════════════════════════════
//  MUTED USERS
// ══════════════════════════════════════════════════

// POST /api/community/mute/:userId — Mute a user (authenticated)
router.post('/mute/:userId', verifyToken, async (req, res) => {
  try {
    const mutedId = parseInt(req.params.userId);
    if (mutedId === req.user.id) {
      return res.status(400).json({ error: 'Cannot mute yourself' });
    }
    await db('community_muted_users').insert({
      user_id: req.user.id,
      muted_user_id: mutedId,
    }).catch(() => {});
    res.json({ muted: true });
  } catch (err) {
    console.error('Mute user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/community/unmute/:userId — Unmute a user (authenticated)
router.post('/unmute/:userId', verifyToken, async (req, res) => {
  try {
    await db('community_muted_users')
      .where({ user_id: req.user.id, muted_user_id: parseInt(req.params.userId) })
      .del();
    res.json({ muted: false });
  } catch (err) {
    console.error('Unmute user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/community/muted — Get muted users list (authenticated)
router.get('/muted', verifyToken, async (req, res) => {
  try {
    let rows = [];
    try {
      rows = await db('community_muted_users')
        .join('users', 'community_muted_users.muted_user_id', 'users.id')
        .where('community_muted_users.user_id', req.user.id)
        .select('users.id', 'users.username', 'users.display_name', 'users.avatar_url');
    } catch {}
    res.json({ muted: rows });
  } catch (err) {
    console.error('List muted error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/community/muted/ids — Get muted user IDs (authenticated)
router.get('/muted/ids', verifyToken, async (req, res) => {
  try {
    let rows = [];
    try {
      rows = await db('community_muted_users')
        .where({ user_id: req.user.id })
        .select('muted_user_id');
    } catch {}
    res.json({ mutedIds: rows.map((r) => r.muted_user_id) });
  } catch (err) {
    console.error('Muted IDs error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ══════════════════════════════════════════════════
//  REACTIONS
// ══════════════════════════════════════════════════

// POST /api/community/reactions/toggle — Toggle emoji reaction (authenticated)
router.post('/reactions/toggle', verifyToken, async (req, res) => {
  try {
    const { post_id, reaction } = req.body;
    if (!post_id || !reaction) {
      return res.status(400).json({ error: 'post_id and reaction are required' });
    }

    const result = await CommunityPostReaction.toggle(req.user.id, post_id, reaction);

    // Get updated reaction counts
    const reactions = await CommunityPostReaction.getForPost(post_id);
    res.json({ ...result, reactions });
  } catch (err) {
    console.error('Toggle reaction error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ══════════════════════════════════════════════════
//  SESSION MANAGEMENT (via auth routes)
// ══════════════════════════════════════════════════
// Sessions are managed from the auth routes file

// ─── POST /api/community/admin/notify — Send direct notification (admin only) ───
router.post('/admin/notify', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const { username, message, link } = req.body;

    if (!username || !message) {
      return res.status(400).json({ error: 'Username and message are required' });
    }

    // Resolve username to user
    const user = await db('users').where({ username }).first();
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    await CommunityNotification.create({
      userId: user.id,
      type: 'system',
      message: message.trim(),
      link: link || null,
    });

    res.json({ success: true, notified_user: user.username });
  } catch (err) {
    console.error('Admin notify error:', err);
    res.status(500).json({ error: 'Failed to send notification' });
  }
});

// ══════════════════════════════════════════════════
//  WORD FILTERS (admin only)
// ══════════════════════════════════════════════════

// GET /api/community/admin/filters — List all word filters
router.get('/admin/filters', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const WordFilter = (await import('../models/WordFilter.js')).default;
    const filters = await WordFilter.findAll();
    res.json({ filters });
  } catch (err) {
    console.error('List filters error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/community/admin/filters — Create word filter
router.post('/admin/filters', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const WordFilter = (await import('../models/WordFilter.js')).default;
    const { pattern, replacement, is_regex, action } = req.body;
    if (!pattern) return res.status(400).json({ error: 'Pattern is required' });
    const filter = await WordFilter.create({ pattern, replacement: replacement || '***', is_regex: is_regex ? 1 : 0, action: action || 'replace', created_by: req.user.id });
    res.status(201).json({ filter });
  } catch (err) {
    console.error('Create filter error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/community/admin/filters/:id — Delete word filter
router.delete('/admin/filters/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const WordFilter = (await import('../models/WordFilter.js')).default;
    await WordFilter.remove(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete filter error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ══════════════════════════════════════════════════
//  USER WARNINGS (admin only)
// ══════════════════════════════════════════════════

// GET /api/community/admin/users/:id/warnings — Get user warnings
router.get('/admin/users/:id/warnings', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const UserWarning = (await import('../models/UserWarning.js')).default;
    const warnings = await UserWarning.findByUser(req.params.id);
    res.json({ warnings });
  } catch (err) {
    console.error('List warnings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/community/admin/users/:id/warnings — Issue warning
router.post('/admin/users/:id/warnings', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const UserWarning = (await import('../models/UserWarning.js')).default;
    const { reason, expires_at } = req.body;
    if (!reason) return res.status(400).json({ error: 'Reason is required' });
    const warning = await UserWarning.create({ userId: req.params.id, issuedBy: req.user.id, reason, expiresAt: expires_at || null });

    // Notify user
    try {
      const Notification = (await import('../models/CommunityNotification.js')).default;
      await Notification.create({
        userId: req.params.id, type: 'system',
        message: `You have received a warning: ${reason}`,
        link: `/community/profile/${req.params.id}`,
      });
    } catch { /* ignore */ }

    res.status(201).json({ warning });
  } catch (err) {
    console.error('Create warning error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/community/admin/users/:id/warnings/count — Count active warnings
router.get('/admin/users/:id/warnings/count', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const UserWarning = (await import('../models/UserWarning.js')).default;
    const count = await UserWarning.countActive(req.params.id);
    res.json({ count });
  } catch (err) {
    console.error('Count warnings error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ══════════════════════════════════════════════════
//  USER NOTES (admin only — private mod notes)
// ══════════════════════════════════════════════════

// GET /api/community/admin/users/:id/notes — Get notes for a user
router.get('/admin/users/:id/notes', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const UserNote = (await import('../models/UserNote.js')).default;
    const notes = await UserNote.findByUser(req.params.id);
    res.json({ notes });
  } catch (err) {
    console.error('List notes error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/community/admin/users/:id/notes — Add note
router.post('/admin/users/:id/notes', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const UserNote = (await import('../models/UserNote.js')).default;
    const { body } = req.body;
    if (!body) return res.status(400).json({ error: 'Body is required' });
    const note = await UserNote.create({ userId: req.params.id, authorId: req.user.id, body });
    res.status(201).json({ note });
  } catch (err) {
    console.error('Create note error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/community/admin/users/:id/notes/:noteId — Edit note
router.put('/admin/users/:id/notes/:noteId', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const UserNote = (await import('../models/UserNote.js')).default;
    const { body } = req.body;
    if (!body) return res.status(400).json({ error: 'Body is required' });
    const note = await UserNote.update(req.params.noteId, body);
    res.json({ note });
  } catch (err) {
    console.error('Update note error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/community/admin/users/:id/notes/:noteId — Delete note
router.delete('/admin/users/:id/notes/:noteId', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const UserNote = (await import('../models/UserNote.js')).default;
    await UserNote.remove(req.params.noteId);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete note error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ══════════════════════════════════════════════════
//  POST EDIT HISTORY
// ══════════════════════════════════════════════════

// GET /api/community/posts/:id/history — Get edit history
router.get('/posts/:id/history', verifyToken, async (req, res) => {
  try {
    const PostEditHistory = (await import('../models/PostEditHistory.js')).default;
    const history = await PostEditHistory.findByPost(req.params.id);
    res.json({ history });
  } catch (err) {
    console.error('Post history error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ══════════════════════════════════════════════════
//  COLLECTIONS
// ══════════════════════════════════════════════════

// GET /api/community/collections — My collections
router.get('/collections', verifyToken, async (req, res) => {
  try {
    const Collection = (await import('../models/Collection.js')).default;
    const collections = await Collection.findByUser(req.user.id);
    res.json({ collections });
  } catch (err) {
    console.error('List collections error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/community/collections — Create collection
router.post('/collections', verifyToken, async (req, res) => {
  try {
    const Collection = (await import('../models/Collection.js')).default;
    const { name, description, is_public } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });
    const collection = await Collection.create({ userId: req.user.id, name, description, isPublic: is_public });
    res.status(201).json({ collection });
  } catch (err) {
    console.error('Create collection error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/community/collections/:id — Update collection
router.put('/collections/:id', verifyToken, async (req, res) => {
  try {
    const Collection = (await import('../models/Collection.js')).default;
    const col = await Collection.findById(req.params.id);
    if (!col) return res.status(404).json({ error: 'Collection not found' });
    if (col.user_id !== req.user.id) return res.status(403).json({ error: 'Not your collection' });
    const updated = await Collection.update(req.params.id, req.body);
    res.json({ collection: updated });
  } catch (err) {
    console.error('Update collection error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/community/collections/:id — Delete collection
router.delete('/collections/:id', verifyToken, async (req, res) => {
  try {
    const Collection = (await import('../models/Collection.js')).default;
    const col = await Collection.findById(req.params.id);
    if (!col) return res.status(404).json({ error: 'Collection not found' });
    if (col.user_id !== req.user.id) return res.status(403).json({ error: 'Not your collection' });
    await Collection.remove(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete collection error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/community/collections/:id/posts — Add post to collection
router.post('/collections/:id/posts', verifyToken, async (req, res) => {
  try {
    const Collection = (await import('../models/Collection.js')).default;
    const col = await Collection.findById(req.params.id);
    if (!col) return res.status(404).json({ error: 'Collection not found' });
    if (col.user_id !== req.user.id) return res.status(403).json({ error: 'Not your collection' });
    const { post_id } = req.body;
    if (!post_id) return res.status(400).json({ error: 'post_id is required' });
    await Collection.addPost(req.params.id, post_id);
    res.status(201).json({ success: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'Post already in collection' });
    console.error('Add to collection error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/community/collections/:id/posts/:postId — Remove post from collection
router.delete('/collections/:id/posts/:postId', verifyToken, async (req, res) => {
  try {
    const Collection = (await import('../models/Collection.js')).default;
    const col = await Collection.findById(req.params.id);
    if (!col) return res.status(404).json({ error: 'Collection not found' });
    if (col.user_id !== req.user.id) return res.status(403).json({ error: 'Not your collection' });
    await Collection.removePost(req.params.id, req.params.postId);
    res.json({ success: true });
  } catch (err) {
    console.error('Remove from collection error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/community/collections/:id/posts — Get posts in collection
router.get('/collections/:id/posts', async (req, res) => {
  try {
    const Collection = (await import('../models/Collection.js')).default;
    const col = await Collection.findById(req.params.id);
    if (!col) return res.status(404).json({ error: 'Collection not found' });
    if (!col.is_public) {
      // Check auth
      let userId = null;
      if (req.headers.authorization) {
        try {
          const jwt = await import('jsonwebtoken');
          const decoded = jwt.default.verify(req.headers.authorization.split(' ')[1], process.env.JWT_SECRET || 'kumocoders-dev-secret-change-in-production');
          userId = decoded.id;
        } catch {}
      }
      if (userId !== col.user_id) return res.status(403).json({ error: 'Private collection' });
    }
    const page = parseInt(req.query.page) || 1;
    const result = await Collection.getPosts(req.params.id, { page });
    res.json({ posts: result.items, total: result.total, page });
  } catch (err) {
    console.error('Get collection posts error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/community/collections/check/:postId — Check which collections contain a post
router.get('/collections/check/:postId', verifyToken, async (req, res) => {
  try {
    const Collection = (await import('../models/Collection.js')).default;
    const collections = await Collection.checkPostInCollections(req.params.postId, req.user.id);
    res.json({ collections });
  } catch (err) {
    console.error('Check collections error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ══════════════════════════════════════════════════
//  LEADERBOARD
// ══════════════════════════════════════════════════

// GET /api/community/leaderboard — Top contributors
router.get('/leaderboard', async (req, res) => {
  try {
    const period = req.query.period || 'all';
    let dateFilter = '';
    if (period === 'week') dateFilter = 'AND community_posts.created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)';
    else if (period === 'month') dateFilter = 'AND community_posts.created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)';

    const [rows] = await db.raw(`
      SELECT
        users.id, users.username, users.display_name, users.avatar_url, users.is_verified, users.role_id,
        COUNT(DISTINCT community_posts.id) AS post_count,
        COALESCE(SUM(community_posts.like_count), 0) AS total_likes,
        COUNT(DISTINCT community_comments.id) AS comment_count
      FROM users
      LEFT JOIN community_posts ON community_posts.user_id = users.id AND community_posts.status = 'published' ${dateFilter}
      LEFT JOIN community_comments ON community_comments.user_id = users.id ${dateFilter.replace('community_posts', 'community_comments')}
      GROUP BY users.id
      HAVING post_count > 0 OR comment_count > 0
      ORDER BY total_likes DESC, post_count DESC
      LIMIT 50
    `);
    res.json({ leaderboard: rows });
  } catch (err) {
    console.error('Leaderboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ══════════════════════════════════════════════════
//  PUSH NOTIFICATIONS
// ══════════════════════════════════════════════════

// POST /api/community/push/subscribe — Save push subscription
router.post('/push/subscribe', verifyToken, async (req, res) => {
  try {
    const PushSubscription = (await import('../models/PushSubscription.js')).default;
    const { endpoint, keys } = req.body;
    if (!endpoint || !keys) return res.status(400).json({ error: 'Missing endpoint or keys' });
    await PushSubscription.create({ userId: req.user.id, endpoint, keys });
    res.status(201).json({ success: true });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') return res.json({ success: true });
    console.error('Push subscribe error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/community/push/unsubscribe — Remove push subscription
router.post('/push/unsubscribe', verifyToken, async (req, res) => {
  try {
    const PushSubscription = (await import('../models/PushSubscription.js')).default;
    const { endpoint } = req.body;
    if (endpoint) await PushSubscription.remove(endpoint);
    else await PushSubscription.removeByUser(req.user.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Push unsubscribe error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ══════════════════════════════════════════════════
//  XP / LEVEL / STREAKS
// ══════════════════════════════════════════════════

// POST /api/community/xp/add — Award XP for activity
router.post('/xp/add', verifyToken, async (req, res) => {
  try {
    const { amount, reason } = req.body;
    if (!amount) return res.status(400).json({ error: 'Amount required' });
    await db('users').where({ id: req.user.id }).increment('xp', amount);
    // Recalc level
    const user = await db('users').where({ id: req.user.id }).select('xp').first();
    const level = Math.floor(Math.sqrt(user.xp / 100)) + 1;
    await db('users').where({ id: req.user.id }).update({ level });
    // Record streak activity
    const UserStreak = (await import('../models/UserStreak.js')).default;
    const streak = await UserStreak.recordActivity(req.user.id);
    res.json({ xp: user.xp + amount, level, streak });
  } catch (err) {
    console.error('XP add error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/community/xp/me — Get current user XP/level/streak
router.get('/xp/me', verifyToken, async (req, res) => {
  try {
    const user = await db('users').where({ id: req.user.id }).select('xp', 'level').first();
    const UserStreak = (await import('../models/UserStreak.js')).default;
    const streak = await UserStreak.get(req.user.id);
    res.json({ xp: user.xp, level: user.level, streak });
  } catch (err) {
    console.error('XP get error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ══════════════════════════════════════════════════
//  DAILY CHALLENGES
// ══════════════════════════════════════════════════

// GET /api/community/challenges/today — Get today's challenge
router.get('/challenges/today', verifyToken, async (req, res) => {
  try {
    const DailyChallenge = (await import('../models/DailyChallenge.js')).default;
    const challenge = await DailyChallenge.getToday();
    const completed = await DailyChallenge.isCompleted(req.user.id, challenge.id);
    res.json({ challenge, completed });
  } catch (err) {
    console.error('Challenge error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/community/challenges/:id/complete — Complete challenge
router.post('/challenges/:id/complete', verifyToken, async (req, res) => {
  try {
    const DailyChallenge = (await import('../models/DailyChallenge.js')).default;
    const result = await DailyChallenge.complete(req.user.id, req.params.id);
    if (!result) return res.status(409).json({ error: 'Already completed' });
    res.json({ success: true, xp_reward: result.xp_reward });
  } catch (err) {
    console.error('Complete challenge error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ══════════════════════════════════════════════════
//  MUTED WORDS / TAGS (per-user)
// ══════════════════════════════════════════════════

// GET /api/community/muted-words — List muted words/tags
router.get('/muted-words', verifyToken, async (req, res) => {
  try {
    const UserMutedWord = (await import('../models/UserMutedWord.js')).default;
    const items = await UserMutedWord.findByUser(req.user.id);
    res.json({ items });
  } catch (err) {
    console.error('Muted words error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/community/muted-words — Add muted word/tag
router.post('/muted-words', verifyToken, async (req, res) => {
  try {
    const UserMutedWord = (await import('../models/UserMutedWord.js')).default;
    const { pattern, is_tag } = req.body;
    if (!pattern) return res.status(400).json({ error: 'Pattern required' });
    const item = await UserMutedWord.create(req.user.id, pattern, is_tag);
    res.status(201).json({ item });
  } catch (err) {
    console.error('Add muted word error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/community/muted-words/:id — Remove muted word/tag
router.delete('/muted-words/:id', verifyToken, async (req, res) => {
  try {
    const UserMutedWord = (await import('../models/UserMutedWord.js')).default;
    await UserMutedWord.remove(req.params.id, req.user.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Remove muted word error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ══════════════════════════════════════════════════
//  POST TEMPLATES
// ══════════════════════════════════════════════════

// GET /api/community/templates — List templates
router.get('/templates', async (req, res) => {
  try {
    const PostTemplate = (await import('../models/PostTemplate.js')).default;
    const templates = await PostTemplate.findAll();
    res.json({ templates });
  } catch (err) {
    console.error('Templates error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/community/admin/templates — Create template (admin)
router.post('/admin/templates', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const PostTemplate = (await import('../models/PostTemplate.js')).default;
    const { name, description, title_template, body_template, tags, icon } = req.body;
    if (!name) return res.status(400).json({ error: 'Name required' });
    const template = await PostTemplate.create({ name, description, title_template, body_template, tags, icon });
    res.status(201).json({ template });
  } catch (err) {
    console.error('Create template error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/community/admin/templates/:id — Delete template
router.delete('/admin/templates/:id', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const PostTemplate = (await import('../models/PostTemplate.js')).default;
    await PostTemplate.remove(req.params.id);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete template error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ══════════════════════════════════════════════════
//  POST SERIES / THREADS
// ══════════════════════════════════════════════════

// GET /api/community/series — My series
router.get('/series', verifyToken, async (req, res) => {
  try {
    const PostSeries = (await import('../models/PostSeries.js')).default;
    const series = await PostSeries.findByUser(req.user.id);
    res.json({ series });
  } catch (err) {
    console.error('Series list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/community/series — Create series
router.post('/series', verifyToken, async (req, res) => {
  try {
    const PostSeries = (await import('../models/PostSeries.js')).default;
    const { title, description } = req.body;
    if (!title) return res.status(400).json({ error: 'Title required' });
    const series = await PostSeries.create({ userId: req.user.id, title, description });
    res.status(201).json({ series });
  } catch (err) {
    console.error('Create series error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/community/series/:id — Get series with posts
router.get('/series/:id', async (req, res) => {
  try {
    const PostSeries = (await import('../models/PostSeries.js')).default;
    const series = await PostSeries.findById(req.params.id);
    if (!series) return res.status(404).json({ error: 'Series not found' });
    const posts = await PostSeries.getPosts(req.params.id);
    res.json({ series, posts });
  } catch (err) {
    console.error('Series detail error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ══════════════════════════════════════════════════
//  FEEDBACK / SUGGESTIONS
// ══════════════════════════════════════════════════

// GET /api/community/feedback — List feedback
router.get('/feedback', async (req, res) => {
  try {
    const Feedback = (await import('../models/Feedback.js')).default;
    const page = parseInt(req.query.page) || 1;
    const result = await Feedback.findAll({ page, category: req.query.category, sort: req.query.sort || 'new' });
    res.json(result);
  } catch (err) {
    console.error('Feedback list error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/community/feedback — Create feedback
router.post('/feedback', verifyToken, async (req, res) => {
  try {
    const Feedback = (await import('../models/Feedback.js')).default;
    const { title, body, category } = req.body;
    if (!title || !body) return res.status(400).json({ error: 'Title and body required' });
    const item = await Feedback.create({ userId: req.user.id, title, body, category });
    res.status(201).json({ item });
  } catch (err) {
    console.error('Create feedback error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/community/feedback/:id/vote — Vote on feedback
router.post('/feedback/:id/vote', verifyToken, async (req, res) => {
  try {
    const Feedback = (await import('../models/Feedback.js')).default;
    const result = await Feedback.vote(req.params.id, req.user.id);
    res.json(result);
  } catch (err) {
    console.error('Vote feedback error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/community/admin/feedback/:id/status — Update status (admin)
router.put('/admin/feedback/:id/status', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const Feedback = (await import('../models/Feedback.js')).default;
    const { status } = req.body;
    if (!['open','planned','completed','declined'].includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const item = await Feedback.updateStatus(req.params.id, status);
    res.json({ item });
  } catch (err) {
    console.error('Update feedback status error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ══════════════════════════════════════════════════
//  WEBHOOKS
// ══════════════════════════════════════════════════

// GET /api/community/webhooks — My webhooks
router.get('/webhooks', verifyToken, async (req, res) => {
  try {
    const webhooks = await db('webhooks').where({ user_id: req.user.id });
    res.json({ webhooks });
  } catch (err) {
    console.error('Webhooks error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/community/webhooks — Create webhook
router.post('/webhooks', verifyToken, async (req, res) => {
  try {
    const { url, events } = req.body;
    if (!url || !events) return res.status(400).json({ error: 'URL and events required' });
    const [id] = await db('webhooks').insert({ user_id: req.user.id, url, events: JSON.stringify(events) });
    res.status(201).json(await db('webhooks').where({ id }).first());
  } catch (err) {
    console.error('Create webhook error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE /api/community/webhooks/:id — Delete webhook
router.delete('/webhooks/:id', verifyToken, async (req, res) => {
  try {
    await db('webhooks').where({ id: req.params.id, user_id: req.user.id }).del();
    res.json({ success: true });
  } catch (err) {
    console.error('Delete webhook error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ══════════════════════════════════════════════════
//  EXPORT USER DATA
// ══════════════════════════════════════════════════

// GET /api/community/export — Export user data as JSON
router.get('/export', verifyToken, async (req, res) => {
  try {
    const user = await db('users').where({ id: req.user.id }).first();
    const posts = await db('community_posts').where({ user_id: req.user.id });
    const comments = await db('community_comments').where({ user_id: req.user.id });
    const likes = await db('community_likes').where({ user_id: req.user.id });
    const bookmarks = await db('community_bookmarks').where({ user_id: req.user.id });
    const notifications = await db('community_notifications').where({ user_id: req.user.id });
    const { password_hash, ...safeUser } = user;
    res.json({ exported_at: new Date().toISOString(), user: safeUser, posts, comments, likes, bookmarks, notifications });
  } catch (err) {
    console.error('Export error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ══════════════════════════════════════════════════
//  OG IMAGE
// ══════════════════════════════════════════════════

// GET /api/community/og-image/:id — Generate OG image for social previews
router.get('/og-image/:id', async (req, res) => {
  try {
    const post = await db('community_posts')
      .select('community_posts.*', 'users.username', 'users.display_name', 'users.avatar_url', 'users.is_verified')
      .join('users', 'community_posts.user_id', 'users.id')
      .where('community_posts.id', req.params.id)
      .first();

    if (!post) return res.status(404).json({ error: 'Post not found' });

    const displayName = escapeXml(post.display_name || post.username || 'Anonymous');
    const username = '@' + escapeXml(post.username || 'anonymous');
    const avatarUrl = post.avatar_url ? escapeXml(post.avatar_url) : '';
    const isVerified = !!post.is_verified;
    const cleaned = (post.body || '')
      .replace(/<[^>]*>/g, '')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 200);

    const tagArray = (post.tags || '').split(',').map(t => t.trim()).filter(Boolean);
    const timeStr = timeAgo(post.created_at);

    const theme = req.query.theme || 'dark';
    const bg = theme === 'light' ? '#ffffff' : '#0d1117';
    const textColor = theme === 'light' ? '#1f2328' : '#e6edf3';
    const mutedColor = theme === 'light' ? '#656d76' : '#8b949e';
    const borderColor = theme === 'light' ? '#d8dee4' : '#21262d';
    const tagBg = theme === 'light' ? 'rgba(9,105,218,0.1)' : 'rgba(88,166,255,0.1)';
    const tagText = theme === 'light' ? '#0969da' : '#58a6ff';

    const displayTitle = escapeXml(post.title || 'KumoCoders Post').slice(0, 80);
    const displayBody = escapeXml(cleaned).slice(0, 200);

    let avatarEl = '';
    if (avatarUrl) {
      avatarEl = `<clipPath id="avatarClip"><circle cx="100" cy="145" r="24"/></clipPath>
        <image clip-path="url(#avatarClip)" x="76" y="121" width="48" height="48" href="${avatarUrl}" />
        <circle cx="100" cy="145" r="24" fill="none" stroke="${borderColor}" stroke-width="1"/>`;
    } else {
      avatarEl = `<circle cx="100" cy="145" r="24" fill="${borderColor}"/>
        <text x="100" y="153" font-family="system-ui, -apple-system, sans-serif" font-size="18" font-weight="700" fill="${textColor}" text-anchor="middle">${displayName.charAt(0).toUpperCase()}</text>`;
    }

    let tagsEl = '';
    if (tagArray.length > 0) {
      let tx = 100;
      const tagItems = [];
      for (const tag of tagArray.slice(0, 4)) {
        const encoded = escapeXml(tag);
        tagItems.push(`${encoded}`);
        const tw = tag.length * 10 + 24;
        tagsEl += `<rect x="${tx}" y="360" width="${tw}" height="28" rx="6" fill="${tagBg}"/>
          <text x="${tx + tw/2}" y="379" font-family="system-ui, -apple-system, sans-serif" font-size="14" fill="${tagText}" text-anchor="middle">#${encoded}</text>`;
        tx += tw + 10;
      }
    }

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
      <defs>${avatarUrl ? '<clipPath id="avatarClip"><circle cx="100" cy="145" r="24"/></clipPath>' : ''}</defs>
      <rect width="1200" height="630" fill="${bg}"/>

      <!-- Card -->
      <rect x="48" y="100" width="1104" height="430" rx="16" fill="${bg}" stroke="${borderColor}" stroke-width="1"/>

      <!-- Divider under header -->
      <line x1="48" y1="185" x2="1152" y2="185" stroke="${borderColor}" stroke-width="1"/>

      <!-- Avatar -->
      ${avatarEl}

      <!-- Display name -->
      <text x="140" y="148" font-family="system-ui, -apple-system, sans-serif" font-size="20" font-weight="700" fill="${textColor}">${displayName}</text>
      ${isVerified ? `<text x="${140 + displayName.length * 12 + 4}" y="148" font-family="system-ui, -apple-system, sans-serif" font-size="16" fill="${tagText}">✓</text>` : ''}
      <text x="${140 + (isVerified ? displayName.length * 12 + 24 : displayName.length * 12 + 4)}" y="148" font-family="system-ui, -apple-system, sans-serif" font-size="16" fill="${mutedColor}">· ${escapeXml(timeStr)}</text>

      <!-- Username -->
      <text x="140" y="172" font-family="system-ui, -apple-system, sans-serif" font-size="16" fill="${mutedColor}">${username}</text>

      <!-- Title -->
      <text x="100" y="265" font-family="system-ui, -apple-system, sans-serif" font-size="36" font-weight="700" fill="${textColor}">${displayTitle}</text>

      <!-- Body -->
      <text x="100" y="325" font-family="system-ui, -apple-system, sans-serif" font-size="18" fill="${mutedColor}">${displayBody}</text>

      <!-- Tags -->
      ${tagsEl}

      <!-- Bottom divider -->
      <line x1="100" y1="415" x2="1100" y2="415" stroke="${borderColor}" stroke-width="1"/>

      <!-- Brand -->
      <text x="100" y="465" font-family="system-ui, -apple-system, sans-serif" font-size="16" font-weight="600" fill="${mutedColor}">KumoCoders</text>

      <!-- URL -->
      <text x="1100" y="465" font-family="system-ui, -apple-system, sans-serif" font-size="16" fill="${mutedColor}" opacity="0.5" text-anchor="end">kumocoders.com/community/post/${post.id}</text>
    </svg>`;

    res.setHeader('Content-Type', 'image/svg+xml');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(svg);
  } catch (err) {
    console.error('OG image error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = Math.floor((now - then) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 2592000) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function escapeXml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

// ══════════════════════════════════════════════════
//  USER FLAIR
// ══════════════════════════════════════════════════

// PUT /api/community/profile/flair — Update flair
router.put('/profile/flair', verifyToken, async (req, res) => {
  try {
    const { flair } = req.body;
    await db('users').where({ id: req.user.id }).update({ flair: flair || null });
    res.json({ flair });
  } catch (err) {
    console.error('Flair update error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
