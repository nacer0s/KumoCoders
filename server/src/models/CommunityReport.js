import db from '../config/db.js';

const CommunityReport = {
  async create({ reporterId, targetType, targetId, reason }) {
    const [id] = await db('community_reports').insert({
      reporter_id: reporterId,
      target_type: targetType,
      target_id: targetId,
      reason,
    });
    return this.findById(id);
  },

  async findById(id) {
    return db('community_reports')
      .select(
        'community_reports.*',
        'reporter.username as reporter_username',
        'reporter.display_name as reporter_display_name',
        'reviewer.username as reviewer_username'
      )
      .leftJoin('users as reporter', 'community_reports.reporter_id', 'reporter.id')
      .leftJoin('users as reviewer', 'community_reports.reviewed_by', 'reviewer.id')
      .where('community_reports.id', id)
      .first();
  },

  async findAll({ status, page = 1, limit = 20 }) {
    let countQuery = db('community_reports');
    if (status) {
      countQuery = countQuery.where('status', status);
    }
    const [{ count }] = await countQuery.count('* as count');

    let query = db('community_reports')
      .select(
        'community_reports.*',
        'reporter.username as reporter_username',
        'reporter.display_name as reporter_display_name'
      )
      .leftJoin('users as reporter', 'community_reports.reporter_id', 'reporter.id')
      .orderBy('community_reports.created_at', 'desc');

    if (status) {
      query = query.where('community_reports.status', status);
    }

    const reports = await query.offset((page - 1) * limit).limit(limit);

    return { reports, total: count, page, limit };
  },

  async getByReporterId(userId, { page = 1, limit = 20 }) {
    const [{ count }] = await db('community_reports')
      .where({ reporter_id: userId })
      .count('* as count');

    const reports = await db('community_reports')
      .select(
        'community_reports.*',
        'reviewer.username as reviewer_username'
      )
      .leftJoin('users as reviewer', 'community_reports.reviewed_by', 'reviewer.id')
      .where({ reporter_id: userId })
      .orderBy('created_at', 'desc')
      .offset((page - 1) * limit)
      .limit(limit);

    return { reports, total: count, page, limit };
  },

  async updateStatus(id, { status, reviewedBy, resolutionNotes }) {
    const updateData = { status };
    if (reviewedBy) updateData.reviewed_by = reviewedBy;
    if (resolutionNotes) updateData.resolution_notes = resolutionNotes;
    if (status === 'resolved' || status === 'dismissed') {
      updateData.reviewed_at = db.fn.now();
    }
    await db('community_reports').where({ id }).update(updateData);
    return this.findById(id);
  },
};

export default CommunityReport;
