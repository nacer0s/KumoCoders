import db from '../config/db.js';

const StudioTeam = {
  async create(data) {
    const [id] = await db('studio_teams').insert({
      name: data.name,
      slug: data.slug,
      description: data.description || null,
      icon: data.icon || 'nf-fa-users',
      color: data.color || '#6366f1',
      created_by: data.createdBy,
    });
    return db('studio_teams').where({ id }).first();
  },

  async findById(id) {
    return db('studio_teams').where({ id }).first();
  },

  async findBySlug(slug) {
    return db('studio_teams').where({ slug }).first();
  },

  async findByUser(userId) {
    return db('studio_teams')
      .select('studio_teams.*', 'studio_memberships.role as membership_role')
      .join('studio_memberships', 'studio_teams.id', 'studio_memberships.team_id')
      .where('studio_memberships.user_id', userId)
      .orderBy('studio_teams.name');
  },

  async update(id, data) {
    await db('studio_teams').where({ id }).update(data);
    return db('studio_teams').where({ id }).first();
  },

  async delete(id) {
    return db('studio_teams').where({ id }).del();
  },
};

export default StudioTeam;
