import db from '../config/db.js';

const StudioApp = {
  async findAll() {
    return db('studio_apps').where({ is_enabled: 1 }).orderBy('name');
  },

  async findByKey(appKey) {
    return db('studio_apps').where({ app_key: appKey }).first();
  },

  async findById(id) {
    return db('studio_apps').where({ id }).first();
  },

  async teamApps(teamId) {
    return db('studio_apps')
      .select('studio_apps.*')
      .join('studio_team_apps', 'studio_apps.id', 'studio_team_apps.app_id')
      .where('studio_team_apps.team_id', teamId)
      .andWhere('studio_apps.is_enabled', 1)
      .orderBy('studio_apps.name');
  },

  async allWithTeamStatus(teamId) {
    const all = await db('studio_apps').where({ is_enabled: 1 }).orderBy('name');
    const teamAppIds = (await db('studio_team_apps').where({ team_id: teamId }).select('app_id')).map(r => r.app_id);
    return all.map(a => ({ ...a, enabled: teamAppIds.includes(a.id) }));
  },

  async enableForTeam(teamId, appId) {
    await db('studio_team_apps').insert({ team_id: teamId, app_id: appId }).onConflict(['team_id', 'app_id']).ignore();
  },

  async disableForTeam(teamId, appId) {
    return db('studio_team_apps').where({ team_id: teamId, app_id: appId }).del();
  },
};

export default StudioApp;
