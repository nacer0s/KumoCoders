import db from '../config/db.js';

const StudioTask = {
  async create(data) {
    const maxPos = await db('studio_tasks')
      .where({ team_id: data.teamId, status: data.status || 'todo' })
      .max('position as maxPos')
      .first();
    const [id] = await db('studio_tasks').insert({
      team_id: data.teamId,
      title: data.title,
      description: data.description || null,
      status: data.status || 'todo',
      priority: data.priority || 'medium',
      assignee_id: data.assigneeId || null,
      created_by: data.createdBy,
      due_date: data.dueDate || null,
      position: (maxPos?.maxPos || 0) + 1,
    });
    return db('studio_tasks')
      .select(
        'studio_tasks.*',
        'assignee.username as assignee_username',
        'assignee.display_name as assignee_display_name',
        'assignee.avatar_url as assignee_avatar_url',
        'creator.username as creator_username'
      )
      .leftJoin('users as creator', 'studio_tasks.created_by', 'creator.id')
      .leftJoin('users as assignee', 'studio_tasks.assignee_id', 'assignee.id')
      .where('studio_tasks.id', id)
      .first();
  },

  async findById(id) {
    return db('studio_tasks')
      .select(
        'studio_tasks.*',
        'assignee.username as assignee_username',
        'assignee.display_name as assignee_display_name',
        'assignee.avatar_url as assignee_avatar_url',
        'creator.username as creator_username'
      )
      .leftJoin('users as creator', 'studio_tasks.created_by', 'creator.id')
      .leftJoin('users as assignee', 'studio_tasks.assignee_id', 'assignee.id')
      .where('studio_tasks.id', id)
      .first();
  },

  async findByTeam(teamId) {
    return db('studio_tasks')
      .select(
        'studio_tasks.*',
        'assignee.username as assignee_username',
        'assignee.display_name as assignee_display_name',
        'assignee.avatar_url as assignee_avatar_url'
      )
      .leftJoin('users as assignee', 'studio_tasks.assignee_id', 'assignee.id')
      .where('studio_tasks.team_id', teamId)
      .orderBy('studio_tasks.position')
      .orderBy('studio_tasks.created_at', 'desc');
  },

  async update(id, data) {
    const updateData = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.assigneeId !== undefined) updateData.assignee_id = data.assigneeId;
    if (data.dueDate !== undefined) updateData.due_date = data.dueDate;
    if (data.position !== undefined) updateData.position = data.position;
    await db('studio_tasks').where({ id }).update(updateData);
    return db('studio_tasks')
      .select(
        'studio_tasks.*',
        'assignee.username as assignee_username',
        'assignee.display_name as assignee_display_name',
        'assignee.avatar_url as assignee_avatar_url'
      )
      .leftJoin('users as assignee', 'studio_tasks.assignee_id', 'assignee.id')
      .where('studio_tasks.id', id)
      .first();
  },

  async delete(id) {
    return db('studio_tasks').where({ id }).del();
  },
};

export default StudioTask;
