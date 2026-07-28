import db from '../config/db.js';

const TABLE = 'reports';

const Report = {
  async create({ userId, type, title, description, severity }) {
    const [id] = await db(TABLE).insert({
      user_id: userId,
      type,
      title,
      description,
      severity: severity || 'medium',
    });
    return this.findById(id);
  },

  async findById(id) {
    return db(TABLE)
      .join('users', `${TABLE}.user_id`, 'users.id')
      .select(
        `${TABLE}.*`,
        'users.username as user_username',
        'users.display_name as user_display_name'
      )
      .where(`${TABLE}.id`, id)
      .first();
  },

  async findAll({ status, type, page = 1, limit = 20 } = {}) {
    const query = db(TABLE)
      .join('users', `${TABLE}.user_id`, 'users.id')
      .select(
        `${TABLE}.*`,
        'users.username as user_username',
        'users.display_name as user_display_name'
      );

    const countQuery = db(TABLE);

    if (status && status !== 'all') {
      query.where(`${TABLE}.status`, status);
      countQuery.where('status', status);
    }
    if (type && type !== 'all') {
      query.where(`${TABLE}.type`, type);
      countQuery.where('type', type);
    }

    const [{ count }] = await countQuery.count('* as count');
    const total = count;

    const reports = await query
      .orderBy(`${TABLE}.created_at`, 'desc')
      .limit(limit)
      .offset((page - 1) * limit);

    return { reports, total };
  },

  async findByUserId(userId) {
    return db(TABLE)
      .where('user_id', userId)
      .orderBy('created_at', 'desc');
  },

  async updateStatus(id, { status, adminNotes } = {}) {
    const updates = {};
    if (status) updates.status = status;
    if (adminNotes !== undefined) updates.admin_notes = adminNotes;
    updates.updated_at = db.fn.now();

    await db(TABLE).where('id', id).update(updates);
    return this.findById(id);
  },
};

export default Report;
