import { Router } from 'express';
import db from '../config/db.js';

const router = Router();

// GET /api/stats/public — Public platform statistics for the landing page
router.get('/public', async (req, res) => {
  try {
    const [
      userCount,
      postCount,
      commentCount,
      likeCount,
      badgeAwardCount,
    ] = await Promise.all([
      db('users').where('is_active', 1).count('* as count').first(),
      db('community_posts').count('* as count').first(),
      db('community_comments').count('* as count').first(),
      db('community_likes').count('* as count').first(),
      db('community_user_badges').count('* as count').first(),
    ]);

    res.json({
      stats: [
        { label: 'Community Posts', value: postCount.count, suffix: '+' },
        { label: 'Active Members', value: userCount.count, suffix: '+' },
        { label: 'Total Likes', value: likeCount.count, suffix: '+' },
        { label: 'Discussions', value: commentCount.count, suffix: '+' },
        { label: 'Achievements', value: badgeAwardCount.count, suffix: '' },
      ],
    });
  } catch (err) {
    console.error('Public stats error:', err);
    // Fallback to empty stats rather than failing
    res.json({
      stats: [
        { label: 'Community Posts', value: 0, suffix: '+' },
        { label: 'Active Members', value: 0, suffix: '+' },
        { label: 'Total Likes', value: 0, suffix: '+' },
        { label: 'Discussions', value: 0, suffix: '+' },
        { label: 'Achievements', value: 0, suffix: '' },
      ],
    });
  }
});

export default router;
