import db from '../config/db.js';

const DEFAULTS = {
  onboarding_complete: false,
  profile_visibility: 'public',
  show_online_status: true,
  show_last_seen: true,
  allow_follows: 'everyone',
  allow_dms: 'everyone',
  show_liked_posts: true,
  show_saved_posts: false,
  nsfw_filter: 'blur',
  feed_density: 'comfortable',
  default_sort: 'new',
  posts_per_page: 20,
  show_preview_images: true,
  hide_downvoted_posts: false,
  notify_likes: true,
  notify_comments: true,
  notify_mentions: true,
  notify_follows: true,
  notify_badges: true,
  notify_system: true,
  theme: 'system',
  font_size: 'medium',
  reduce_motion: false,
  high_contrast: false,
  font_family: 'system',
  two_factor_auth: false,
  login_alerts: true,
  session_timeout: '24h',
};

const UserSettings = {
  async get(userId) {
    try {
      let row = await db('user_settings').where({ user_id: userId }).first();
      if (!row) {
        try {
          await db('user_settings').insert({
            user_id: userId,
            settings: JSON.stringify(DEFAULTS),
          });
        } catch {}
        return { ...DEFAULTS };
      }
      return { ...DEFAULTS, ...JSON.parse(row.settings || '{}') };
    } catch {
      return { ...DEFAULTS };
    }
  },

  async update(userId, updates) {
    const current = await this.get(userId);
    const merged = { ...current, ...updates };
    try {
      const exists = await db('user_settings').where({ user_id: userId }).first();
      if (exists) {
        await db('user_settings').where({ user_id: userId }).update({ settings: JSON.stringify(merged) });
      } else {
        await db('user_settings').insert({ user_id: userId, settings: JSON.stringify(merged) });
      }
    } catch {}
    return merged;
  },
};

export default UserSettings;
