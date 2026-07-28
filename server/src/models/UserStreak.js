import db from '../config/db.js';

const UserStreak = {
  async get(userId) {
    let streak = await db('user_streaks').where({ user_id: userId }).first();
    if (!streak) {
      await db('user_streaks').insert({ user_id: userId, current_streak: 0, longest_streak: 0, last_active_date: null });
      streak = await db('user_streaks').where({ user_id: userId }).first();
    }
    return streak;
  },

  async recordActivity(userId) {
    const streak = await this.get(userId);
    const today = new Date().toISOString().slice(0, 10);
    if (streak.last_active_date === today) return streak;

    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    let current = streak.last_active_date === yesterday ? (streak.current_streak || 0) + 1 : 1;
    const longest = Math.max(current, streak.longest_streak || 0);

    await db('user_streaks').where({ user_id: userId }).update({ current_streak: current, longest_streak: longest, last_active_date: today });
    return { current_streak: current, longest_streak: longest, last_active_date: today };
  },
};

export default UserStreak;
