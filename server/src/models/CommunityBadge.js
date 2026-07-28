import db from '../config/db.js';

/** Badge criteria keys matching the `badges.criteria` column */
const BADGE_CRITERIA = {
  FIRST_POST: 'Create your first post',
  RISING_STAR: 'Reach 5 posts',
  POPULAR: 'Reach 10 likes on one post',
  CHATTER: 'Reach 50 comments',
  HEARTBREAKER: 'Reach 100 likes received',
  SOCIAL_BUTTERFLY: 'Get 10 followers',
  BOOKWORM: 'Bookmark 5 posts',
  GOOD_CITIZEN: 'Like 10 posts',
  COMMENTER: 'Leave 10 comments',
  DIVERSE: 'Use 3 different tags',
  CONSISTENT: 'Post on 5 different days',
  WRITER: 'Write a 500+ char post',
  CONTRIBUTOR: 'Reach 50 total likes received',
  VETERAN: 'Member for 30 days',
  NIGHT_OWL: 'Post between midnight and 5 AM',
};

const CommunityBadge = {
  async getByUserId(userId) {
    return db('community_user_badges')
      .select(
        'community_user_badges.*',
        'badges.name',
        'badges.description',
        'badges.icon',
        'badges.criteria'
      )
      .join('badges', 'community_user_badges.badge_id', 'badges.id')
      .where('community_user_badges.user_id', userId)
      .orderBy('community_user_badges.awarded_at', 'desc');
  },

  /** Get all badges with earned status and progress for a user */
  async getAllBadges(userId) {
    const allBadges = await db('badges').select('*');
    const earnedBadges = await db('community_user_badges')
      .where({ user_id: userId })
      .select('badge_id', 'awarded_at');
    const earnedMap = new Map(earnedBadges.map((b) => [b.badge_id, b.awarded_at]));

    // Calculate current progress for each badge
    const postCount = await db('community_posts')
      .where({ user_id: userId })
      .count('* as count').first();
    const commentCount = await db('community_comments')
      .where({ user_id: userId })
      .count('* as count').first();
    const topPost = await db('community_posts')
      .where({ user_id: userId })
      .orderBy('like_count', 'desc')
      .first();
    const [{ totalLikes }] = await db('community_posts')
      .where({ user_id: userId })
      .sum('like_count as totalLikes');

    const posts = postCount?.count || 0;
    const comments = commentCount?.count || 0;
    const totalLikesReceived = totalLikes || 0;
    const maxLikesOnPost = topPost?.like_count || 0;

    async function getProgress(criteria) {
      switch (criteria) {
        case BADGE_CRITERIA.FIRST_POST:    return { current: Math.min(posts, 1), target: 1 };
        case BADGE_CRITERIA.RISING_STAR:   return { current: Math.min(posts, 5), target: 5 };
        case BADGE_CRITERIA.POPULAR:       return { current: Math.min(maxLikesOnPost, 10), target: 10 };
        case BADGE_CRITERIA.CHATTER:       return { current: Math.min(comments, 50), target: 50 };
        case BADGE_CRITERIA.HEARTBREAKER:  return { current: Math.min(totalLikesReceived, 100), target: 100 };
        case BADGE_CRITERIA.SOCIAL_BUTTERFLY: {
          const [{ count: f }] = await db('community_follows').where({ following_id: userId }).count('* as count');
          return { current: Math.min(f, 10), target: 10 };
        }
        case BADGE_CRITERIA.BOOKWORM: {
          const [{ count: b }] = await db('community_bookmarks').where({ user_id: userId }).count('* as count');
          return { current: Math.min(b, 5), target: 5 };
        }
        case BADGE_CRITERIA.GOOD_CITIZEN: {
          const [{ count: l }] = await db('community_likes').where({ user_id: userId, target_type: 'post' }).count('* as count');
          return { current: Math.min(l, 10), target: 10 };
        }
        case BADGE_CRITERIA.COMMENTER:     return { current: Math.min(comments, 10), target: 10 };
        case BADGE_CRITERIA.DIVERSE: {
          const rows = await db('community_posts').where({ user_id: userId, status: 'published' }).whereNotNull('tags').where('tags', '!=', '').select('tags');
          const tagSet = new Set(rows.flatMap(r => (r.tags || '').split(',').map(t => t.trim()).filter(Boolean)));
          return { current: Math.min(tagSet.size, 3), target: 3 };
        }
        case BADGE_CRITERIA.CONSISTENT: {
          const [row] = await db.raw('SELECT COUNT(DISTINCT DATE(created_at)) AS count FROM community_posts WHERE user_id = ? AND status = ?', [userId, 'published']);
          const d = row[0]?.count || 0;
          return { current: Math.min(d, 5), target: 5 };
        }
        case BADGE_CRITERIA.WRITER: {
          const longPost = await db('community_posts').where({ user_id: userId, status: 'published' }).whereRaw('CHAR_LENGTH(body) >= 500').count('* as count').first();
          return { current: Math.min(longPost?.count || 0, 1), target: 1 };
        }
        case BADGE_CRITERIA.CONTRIBUTOR:   return { current: Math.min(totalLikesReceived, 50), target: 50 };
        case BADGE_CRITERIA.VETERAN: {
          const u = await db('users').where({ id: userId }).select('created_at').first();
          const daysSince = u ? Math.floor((Date.now() - new Date(u.created_at).getTime()) / 86400000) : 0;
          return { current: Math.min(daysSince, 30), target: 30 };
        }
        case BADGE_CRITERIA.NIGHT_OWL: {
          const owl = await db('community_posts').where({ user_id: userId, status: 'published' }).whereRaw('HOUR(created_at) >= 0 AND HOUR(created_at) < 5').count('* as count').first();
          return { current: Math.min(owl?.count || 0, 1), target: 1 };
        }
        default:                           return { current: 0, target: 0 };
      }
    }

    return await Promise.all(allBadges.map(async (badge) => ({
      id: badge.id,
      name: badge.name,
      description: badge.description,
      icon: badge.icon,
      criteria: badge.criteria,
      earned: earnedMap.has(badge.id),
      awarded_at: earnedMap.get(badge.id) || null,
      progress: await getProgress(badge.criteria),
    })));
  },

  async award(userId, badgeId) {
    // Check if already awarded
    const existing = await db('community_user_badges')
      .where({ user_id: userId, badge_id: badgeId })
      .first();
    if (existing) return null;

    await db('community_user_badges').insert({ user_id: userId, badge_id: badgeId });

    const badge = await db('badges').where({ id: badgeId }).first();

    // Also create a notification for the badge award
    try {
      const Notification = (await import('./CommunityNotification.js')).default;
      await Notification.create({
        userId,
        type: 'badge',
        message: `You earned the "${badge.name}" badge!`,
        link: `/community/profile/${userId}`,
        badgeName: badge.name,
      });
    } catch { /* ignore notification errors */ }

    // Create milestone announcement post
    try {
      await db('community_posts').insert({
        user_id: userId,
        title: `🏆 Earned "${badge.name}"!`,
        body: `I just earned the **"${badge.name}"** badge: ${badge.description || ''}\n\nCheck out all achievements on my profile!`,
        tags: 'achievements,milestone',
        status: 'published',
        is_pinned: 0,
        created_at: db.fn.now(),
        updated_at: db.fn.now(),
      });
    } catch { /* ignore milestone post errors */ }

    return badge;
  },

  async checkAndAward(userId) {
    const user = await db('users').where({ id: userId }).first();
    if (!user) return [];

    const badges = await db('badges').select('*');
    const awarded = await db('community_user_badges')
      .where({ user_id: userId })
      .select('badge_id');
    const awardedIds = new Set(awarded.map((a) => a.badge_id));

    const newBadges = [];

    for (const badge of badges) {
      if (awardedIds.has(badge.id)) continue;

      let earned = false;

      switch (badge.criteria) {
        case BADGE_CRITERIA.FIRST_POST: {
          const [{ count }] = await db('community_posts')
            .where({ user_id: userId })
            .count('* as count');
          earned = count >= 1;
          break;
        }
        case BADGE_CRITERIA.RISING_STAR: {
          const [{ count }] = await db('community_posts')
            .where({ user_id: userId })
            .count('* as count');
          earned = count >= 5;
          break;
        }
        case BADGE_CRITERIA.POPULAR: {
          const topPost = await db('community_posts')
            .where({ user_id: userId })
            .orderBy('like_count', 'desc')
            .first();
          earned = topPost && topPost.like_count >= 10;
          break;
        }
        case BADGE_CRITERIA.CHATTER: {
          const [{ count }] = await db('community_comments')
            .where({ user_id: userId })
            .count('* as count');
          earned = count >= 50;
          break;
        }
        case BADGE_CRITERIA.HEARTBREAKER: {
          const [{ total }] = await db('community_posts')
            .where({ user_id: userId })
            .sum('like_count as total')
            .first();
          earned = (total || 0) >= 100;
          break;
        }
        case BADGE_CRITERIA.SOCIAL_BUTTERFLY: {
          const [{ count: f }] = await db('community_follows')
            .where({ following_id: userId })
            .count('* as count');
          earned = f >= 10;
          break;
        }
        case BADGE_CRITERIA.BOOKWORM: {
          const [{ count: b }] = await db('community_bookmarks')
            .where({ user_id: userId })
            .count('* as count');
          earned = b >= 5;
          break;
        }
        case BADGE_CRITERIA.GOOD_CITIZEN: {
          const [{ count: l }] = await db('community_likes')
            .where({ user_id: userId, target_type: 'post' })
            .count('* as count');
          earned = l >= 10;
          break;
        }
        case BADGE_CRITERIA.COMMENTER: {
          const [{ count: c }] = await db('community_comments')
            .where({ user_id: userId })
            .count('* as count');
          earned = c >= 10;
          break;
        }
        case BADGE_CRITERIA.DIVERSE: {
          const rows = await db('community_posts')
            .where({ user_id: userId, status: 'published' })
            .whereNotNull('tags').where('tags', '!=', '').select('tags');
          const tagSet = new Set(rows.flatMap(r => (r.tags || '').split(',').map(t => t.trim()).filter(Boolean)));
          earned = tagSet.size >= 3;
          break;
        }
        case BADGE_CRITERIA.CONSISTENT: {
          const [row] = await db.raw('SELECT COUNT(DISTINCT DATE(created_at)) AS count FROM community_posts WHERE user_id = ? AND status = ?', [userId, 'published']);
          const d = row[0]?.count || 0;
          earned = d >= 5;
          break;
        }
        case BADGE_CRITERIA.WRITER: {
          const [{ count: w }] = await db('community_posts')
            .where({ user_id: userId, status: 'published' })
            .whereRaw('CHAR_LENGTH(body) >= 500')
            .count('* as count');
          earned = w >= 1;
          break;
        }
        case BADGE_CRITERIA.CONTRIBUTOR: {
          const [{ total: t }] = await db('community_posts')
            .where({ user_id: userId })
            .sum('like_count as total');
          earned = (t || 0) >= 50;
          break;
        }
        case BADGE_CRITERIA.VETERAN: {
          const u = await db('users').where({ id: userId }).select('created_at').first();
          const daysSince = u ? Math.floor((Date.now() - new Date(u.created_at).getTime()) / 86400000) : 0;
          earned = daysSince >= 30;
          break;
        }
        case BADGE_CRITERIA.NIGHT_OWL: {
          const [{ count: n }] = await db('community_posts')
            .where({ user_id: userId, status: 'published' })
            .whereRaw('HOUR(created_at) >= 0 AND HOUR(created_at) < 5')
            .count('* as count');
          earned = n >= 1;
          break;
        }
      }

      if (earned) {
        const result = await this.award(userId, badge.id);
        if (result) newBadges.push(result);
      }
    }

    return newBadges;
  },
};

export default CommunityBadge;
