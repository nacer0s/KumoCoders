import { Router } from 'express';
import db from '../config/db.js';
import { verifyToken } from '../middleware/auth.js';
import { requireRole } from '../middleware/roles.js';

const router = Router();

// GET /api/admin/stats — Comprehensive platform statistics (admin only)
router.get('/stats', verifyToken, requireRole('admin'), async (req, res) => {
  try {
    const [
      // User stats
      userCountResult,
      activeUserCountResult,
      newUsersWeekResult,
      newUsersMonthResult,
      adminCountResult,
      communityCountResult,
      usersTotal,
      latestUsers,

      // Post stats
      postCountResult,
      postsWeekResult,
      pinnedCountResult,
      totalLikesResult,
      likesWeekResult,
      popularPosts,

      // Comment stats
      commentCountResult,
      commentsWeekResult,
      activeCommenters,

      // Bookmark stats
      bookmarkCountResult,
      bookmarkersCountResult,

      // Notification stats
      notificationCountResult,
      unreadNotifResult,

      // Badge stats
      badgeCountResult,
      totalAwardedBadges,
      badgeBreakdown,
      usersWithBadges,

      // Poll stats
      pollCountResult,
      totalVotesResult,

      // Content stats
      contentCountResult,
    ] = await Promise.all([
      // ─── Users ───
      db('users').count('* as count').first(),
      db('users').where('is_active', 1).count('* as count').first(),
      db('users').where('created_at', '>=', db.raw('NOW() - INTERVAL 7 DAY')).count('* as count').first(),
      db('users').where('created_at', '>=', db.raw('NOW() - INTERVAL 30 DAY')).count('* as count').first(),
      db('users').where('role_id', 1).count('* as count').first(),
      db('users').where('role_id', 2).count('* as count').first(),
      db('users').count('* as total').first(),
      db('users').select('id', 'username', 'display_name', 'email', 'role_id', 'is_active', 'created_at').orderBy('created_at', 'desc').limit(5),

      // ─── Posts ───
      db('community_posts').count('* as count').first(),
      db('community_posts').where('created_at', '>=', db.raw('NOW() - INTERVAL 7 DAY')).count('* as count').first(),
      db('community_posts').where('is_pinned', 1).count('* as count').first(),
      db('community_likes').where('target_type', 'post').count('* as count').first(),
      db('community_likes').where('created_at', '>=', db.raw('NOW() - INTERVAL 7 DAY')).count('* as count').first(),
      db('community_posts')
        .select(
          'community_posts.id',
          'community_posts.title',
          'community_posts.like_count',
          'community_posts.comment_count',
          'community_posts.created_at',
          'users.username as author_username',
          'users.display_name as author_display_name'
        )
        .join('users', 'community_posts.user_id', 'users.id')
        .orderBy('community_posts.like_count', 'desc')
        .limit(5),

      // ─── Comments ───
      db('community_comments').count('* as count').first(),
      db('community_comments').where('created_at', '>=', db.raw('NOW() - INTERVAL 7 DAY')).count('* as count').first(),
      db('community_comments')
        .select('users.id', 'users.username', 'users.display_name')
        .join('users', 'community_comments.user_id', 'users.id')
        .groupBy('community_comments.user_id', 'users.id', 'users.username', 'users.display_name')
        .count('community_comments.id as comment_count')
        .orderBy('comment_count', 'desc')
        .limit(5),

      // ─── Bookmarks ───
      db('community_bookmarks').count('* as count').first(),
      db('community_bookmarks').countDistinct('user_id as count').first(),

      // ─── Notifications ───
      db('community_notifications').count('* as count').first(),
      db('community_notifications').where('is_read', 0).count('* as count').first(),

      // ─── Badges ───
      db('badges').count('* as count').first(),
      db('community_user_badges').count('* as count').first(),
      db('badges')
        .select('badges.name', 'badges.icon', 'badges.description')
        .count('community_user_badges.id as awarded_count')
        .leftJoin('community_user_badges', 'badges.id', 'community_user_badges.badge_id')
        .groupBy('badges.id', 'badges.name', 'badges.icon', 'badges.description')
        .orderBy('awarded_count', 'desc'),
      db('community_user_badges').countDistinct('user_id as count').first(),

      // ─── Polls ───
      db('community_polls').count('* as count').first(),
      db('community_poll_votes').count('* as count').first(),

      // ─── Content ───
      db('landing_content').count('* as count').first(),
    ]);

    // ─── Recent activity ───
    const recentPosts = await db('community_posts')
      .select(
        db.raw("'post' as type"),
        'community_posts.id',
        'community_posts.title',
        'community_posts.created_at',
        'users.username',
        'users.display_name'
      )
      .join('users', 'community_posts.user_id', 'users.id')
      .orderBy('community_posts.created_at', 'desc')
      .limit(5);

    const recentComments = await db('community_comments')
      .select(
        db.raw("'comment' as type"),
        'community_comments.id',
        db.raw('SUBSTRING(community_comments.body, 1, 80) as title'),
        'community_comments.created_at',
        'users.username',
        'users.display_name'
      )
      .join('users', 'community_comments.user_id', 'users.id')
      .orderBy('community_comments.created_at', 'desc')
      .limit(5);

    // Combine and sort by date
    const recentActivity = [...recentPosts, ...recentComments]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 10);

    // ─── Posts per day (last 14 days) ───
    const postsPerDay = await db('community_posts')
      .select(db.raw('DATE(created_at) as date'), db.raw('COUNT(*) as count'))
      .where('created_at', '>=', db.raw('NOW() - INTERVAL 14 DAY'))
      .groupBy(db.raw('DATE(created_at)'))
      .orderBy('date', 'asc');

    // ─── Likes per day (last 14 days) ───
    const likesPerDay = await db('community_likes')
      .select(db.raw('DATE(created_at) as date'), db.raw('COUNT(*) as count'))
      .where('created_at', '>=', db.raw('NOW() - INTERVAL 14 DAY'))
      .groupBy(db.raw('DATE(created_at)'))
      .orderBy('date', 'asc');

    // ─── User registrations per day (last 14 days) ───
    const usersPerDay = await db('users')
      .select(db.raw('DATE(created_at) as date'), db.raw('COUNT(*) as count'))
      .where('created_at', '>=', db.raw('NOW() - INTERVAL 14 DAY'))
      .groupBy(db.raw('DATE(created_at)'))
      .orderBy('date', 'asc');

    // ─── Number of comments per post (for distribution) ───
    const postStats = await db('community_posts')
      .select(db.raw('AVG(like_count) as avg_likes'), db.raw('AVG(comment_count) as avg_comments'))
      .first();

    res.json({
      users: {
        total: userCountResult.count,
        active: activeUserCountResult.count,
        newThisWeek: newUsersWeekResult.count,
        newThisMonth: newUsersMonthResult.count,
        admins: adminCountResult.count,
        communityMembers: communityCountResult.count,
        totalAll: usersTotal.total,
        latestUsers,
      },
      posts: {
        total: postCountResult.count,
        thisWeek: postsWeekResult.count,
        pinned: pinnedCountResult.count,
        avgLikes: Math.round((postStats?.avg_likes || 0) * 10) / 10,
        avgComments: Math.round((postStats?.avg_comments || 0) * 10) / 10,
        popularPosts,
      },
      likes: {
        total: totalLikesResult.count,
        thisWeek: likesWeekResult.count,
      },
      comments: {
        total: commentCountResult.count,
        thisWeek: commentsWeekResult.count,
        activeCommenters,
      },
      bookmarks: {
        total: bookmarkCountResult.count,
        uniqueUsers: bookmarkersCountResult.count,
      },
      notifications: {
        total: notificationCountResult.count,
        unread: unreadNotifResult.count,
      },
      badges: {
        totalDefinitions: badgeCountResult.count,
        totalAwarded: totalAwardedBadges.count,
        usersWithBadges: usersWithBadges.count,
        breakdown: badgeBreakdown,
      },
      polls: {
        total: pollCountResult.count,
        totalVotes: totalVotesResult.count,
      },
      content: {
        totalSections: contentCountResult.count,
      },
      activity: {
        recentActivity,
        postsPerDay,
        likesPerDay,
        usersPerDay,
      },
      lastUpdated: new Date().toISOString(),
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
