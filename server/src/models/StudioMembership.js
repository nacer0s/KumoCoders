import db from '../config/db.js';

const StudioMembership = {
  async add(teamId, userId, role = 'member') {
    const [id] = await db('studio_memberships').insert({
      team_id: teamId,
      user_id: userId,
      role,
    });
    return db('studio_memberships').where({ id }).first();
  },

  async find(teamId, userId) {
    return db('studio_memberships')
      .where({ team_id: teamId, user_id: userId })
      .first();
  },

  async findByTeam(teamId) {
    return db('studio_memberships')
      .select(
        'studio_memberships.*',
        'users.username',
        'users.display_name',
        'users.avatar_url',
        'users.email',
        'users.role_id'
      )
      .join('users', 'studio_memberships.user_id', 'users.id')
      .where('studio_memberships.team_id', teamId)
      .orderBy('studio_memberships.role')
      .orderBy('users.display_name');
  },

  async updateRole(teamId, userId, role) {
    await db('studio_memberships')
      .where({ team_id: teamId, user_id: userId })
      .update({ role });
    return db('studio_memberships')
      .where({ team_id: teamId, user_id: userId })
      .first();
  },

  async remove(teamId, userId) {
    return db('studio_memberships')
      .where({ team_id: teamId, user_id: userId })
      .del();
  },

  async countByTeam(teamId) {
    const result = await db('studio_memberships')
      .where({ team_id: teamId })
      .count('* as count')
      .first();
    return Number(result.count);
  },
};

export default StudioMembership;
