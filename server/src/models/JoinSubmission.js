import crypto from 'crypto';
import db from '../config/db.js';

const JoinSubmission = {
  async create(data) {
    const token = crypto.randomBytes(8).toString('hex');
    const [id] = await db('join_submissions').insert({
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      phone: data.phone || null,
      country: data.country || null,
      current_role: data.current_role || null,
      years_experience: data.years_experience || null,
      availability: data.availability || null,
      interest_type: data.interest_type || 'general',
      skills: data.skills || null,
      portfolio_url: data.portfolio_url || null,
      linkedin_url: data.linkedin_url || null,
      twitter_url: data.twitter_url || null,
      discord_username: data.discord_username || null,
      hear_about: data.hear_about || null,
      message: data.message || null,
      tracking_token: token,
    });
    return db('join_submissions').where({ id }).first();
  },

  async findById(id) {
    return db('join_submissions').where({ id }).first();
  },

  async findByToken(token) {
    return db('join_submissions').where({ tracking_token: token }).first();
  },

  async findByEmail(email) {
    return db('join_submissions').where({ email }).orderBy('created_at', 'desc').first();
  },

  async findAll({ page = 1, limit = 50 } = {}) {
    const offset = (page - 1) * limit;
    const [{ count }] = await db('join_submissions').count('* as count');
    const submissions = await db('join_submissions')
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);
    return { submissions, total: count, page, limit, pages: Math.ceil(count / limit) };
  },

  async updateStatus(id, status, notes = null) {
    const update = {
      status,
      status_updated_at: db.fn.now(),
    };
    if (notes !== null) update.review_notes = notes;
    await db('join_submissions').where({ id }).update(update);
    return db('join_submissions').where({ id }).first();
  },

  async delete(id) {
    return db('join_submissions').where({ id }).del();
  },
};

export default JoinSubmission;
