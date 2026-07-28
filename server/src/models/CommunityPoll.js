import db from '../config/db.js';

const CommunityPoll = {
  async findByPostId(postId) {
    const poll = await db('community_polls').where({ post_id: postId }).first();
    if (!poll) return null;
    const options = await db('community_poll_options')
      .where({ poll_id: poll.id })
      .orderBy('id', 'asc');
    return { ...poll, options };
  },

  /**
   * Batch-fetch polls for multiple post IDs.
   * Returns a Map of post_id -> poll data (with options, total_votes, user_vote).
   * @param {number[]} postIds
   * @param {number|null} userId - optional, for checking user's vote
   * @returns {Promise<Map<number, object>>}
   */
  async findByPostIds(postIds, userId = null) {
    if (!postIds || postIds.length === 0) return new Map();

    const polls = await db('community_polls')
      .whereIn('post_id', postIds)
      .orderBy('id', 'asc');

    if (polls.length === 0) return new Map();

    const pollIds = polls.map((p) => p.id);

    // Fetch all options for these polls in one query
    const allOptions = await db('community_poll_options')
      .whereIn('poll_id', pollIds)
      .orderBy('id', 'asc');

    // Fetch all user votes for these polls if user is logged in
    let userVotes = [];
    if (userId) {
      userVotes = await db('community_poll_votes')
        .whereIn('poll_id', pollIds)
        .where('user_id', userId);
    }
    const userVoteMap = {};
    for (const v of userVotes) {
      userVoteMap[v.poll_id] = v.option_id;
    }

    // Group options by poll_id
    const optionsByPoll = {};
    for (const opt of allOptions) {
      if (!optionsByPoll[opt.poll_id]) optionsByPoll[opt.poll_id] = [];
      optionsByPoll[opt.poll_id].push(opt);
    }

    const now = new Date();
    const resultMap = new Map();

    for (const poll of polls) {
      const options = optionsByPoll[poll.id] || [];
      const totalVotes = options.reduce((sum, o) => sum + (o.vote_count || 0), 0);
      const userVote = userVoteMap[poll.id] || null;
      const isExpired = poll.expires_at ? new Date(poll.expires_at) < now : false;

      resultMap.set(poll.post_id, {
        id: poll.id,
        post_id: poll.post_id,
        question: poll.question,
        expires_at: poll.expires_at,
        is_expired: isExpired,
        total_votes: totalVotes,
        user_vote: userVote,
        options: options.map((o) => ({
          id: o.id,
          text: o.text,
          vote_count: o.vote_count || 0,
          percentage: totalVotes > 0 ? Math.round(((o.vote_count || 0) / totalVotes) * 100) : 0,
        })),
      });
    }

    return resultMap;
  },

  async create(data) {
    const { postId, question, options, expiresAt } = data;
    const [pollId] = await db('community_polls').insert({
      post_id: postId,
      question,
      expires_at: expiresAt || null,
    });

    const insertedOptions = [];
    for (const text of options) {
      const [optId] = await db('community_poll_options').insert({
        poll_id: pollId,
        text,
      });
      insertedOptions.push({ id: optId, poll_id: pollId, text, vote_count: 0 });
    }

    return { id: pollId, post_id: postId, question, expires_at: expiresAt, options: insertedOptions };
  },

  async vote(pollId, optionId, userId) {
    // Check poll exists
    const poll = await db('community_polls').where({ id: pollId }).first();
    if (!poll) throw new Error('Poll not found');

    // Check if already voted
    const existing = await db('community_poll_votes')
      .where({ poll_id: pollId, user_id: userId })
      .first();
    if (existing) throw new Error('Already voted');

    // Check if expired
    if (poll.expires_at && new Date(poll.expires_at) < new Date()) {
      throw new Error('Poll has expired');
    }

    // Check option belongs to poll
    const option = await db('community_poll_options')
      .where({ id: optionId, poll_id: pollId })
      .first();
    if (!option) throw new Error('Invalid option');

    await db('community_poll_votes').insert({
      poll_id: pollId,
      option_id: optionId,
      user_id: userId,
    });

    await db('community_poll_options')
      .where({ id: optionId })
      .increment('vote_count', 1);

    return this.getResults(pollId, userId);
  },

  async getResults(pollId, userId) {
    const poll = await db('community_polls').where({ id: pollId }).first();
    if (!poll) return null;

    const options = await db('community_poll_options')
      .where({ poll_id: pollId })
      .orderBy('id', 'asc');

    const totalVotes = options.reduce((sum, o) => sum + o.vote_count, 0);

    // Check if user voted
    let userVote = null;
    if (userId) {
      const vote = await db('community_poll_votes')
        .where({ poll_id: pollId, user_id: userId })
        .first();
      if (vote) {
        userVote = vote.option_id;
      }
    }

    const isExpired = poll.expires_at ? new Date(poll.expires_at) < new Date() : false;

    return {
      id: poll.id,
      post_id: poll.post_id,
      question: poll.question,
      expires_at: poll.expires_at,
      is_expired: isExpired,
      total_votes: totalVotes,
      user_vote: userVote,
      options: options.map((o) => ({
        id: o.id,
        text: o.text,
        vote_count: o.vote_count,
        percentage: totalVotes > 0 ? Math.round((o.vote_count / totalVotes) * 100) : 0,
      })),
    };
  },
};

export default CommunityPoll;
