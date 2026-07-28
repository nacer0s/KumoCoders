import db from '../config/db.js';

const DailyChallenge = {
  async getToday() {
    const today = new Date().toISOString().slice(0, 10);
    let challenge = await db('daily_challenges').where({ challenge_date: today }).first();
    if (!challenge) {
      const titles = [
        { title: 'Share something you learned', desc: 'Post a tutorial or tip' },
        { title: 'Show your work', desc: 'Share a project or code snippet' },
        { title: 'Help someone out', desc: 'Answer a question or comment helpfully' },
        { title: 'Start a discussion', desc: 'Post a thought-provoking question' },
        { title: 'Give feedback', desc: 'Comment on 3 posts with constructive feedback' },
      ];
      const pick = titles[Math.floor(Math.random() * titles.length)];
      const [id] = await db('daily_challenges').insert({ title: pick.title, description: pick.desc, xp_reward: 50, challenge_date: today });
      challenge = await db('daily_challenges').where({ id }).first();
    }
    return challenge;
  },

  async isCompleted(userId, challengeId) {
    const row = await db('user_challenge_completions').where({ user_id: userId, challenge_id: challengeId }).first();
    return !!row;
  },

  async complete(userId, challengeId) {
    const exists = await db('user_challenge_completions').where({ user_id: userId, challenge_id: challengeId }).first();
    if (exists) return null;
    const [{ xp_reward }] = await db('daily_challenges').where({ id: challengeId }).select('xp_reward');
    await db('user_challenge_completions').insert({ user_id: userId, challenge_id: challengeId });
    await db('users').where({ id: userId }).increment('xp', xp_reward);
    await this.recalcLevel(userId);
    return { xp_reward };
  },

  async recalcLevel(userId) {
    const user = await db('users').where({ id: userId }).select('xp').first();
    const level = Math.floor(Math.sqrt(user.xp / 100)) + 1;
    await db('users').where({ id: userId }).update({ level });
  },
};

export default DailyChallenge;
