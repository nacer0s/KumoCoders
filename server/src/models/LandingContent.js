import db from '../config/db.js';

const LandingContent = {
  async findAll() {
    return db('landing_content').select('*');
  },

  async findByKey(sectionKey) {
    return db('landing_content').where({ section_key: sectionKey }).first();
  },

  async upsert(sectionKey, data) {
    const existing = await this.findByKey(sectionKey);
    const payload = {
      title: data.title ?? null,
      subtitle: data.subtitle ?? null,
      body: data.body ?? null,
      metadata: data.metadata ? JSON.stringify(data.metadata) : undefined,
      updated_by: data.updatedBy ?? null,
    };

    if (existing) {
      await db('landing_content').where({ section_key: sectionKey }).update(payload);
    } else {
      await db('landing_content').insert({
        section_key: sectionKey,
        ...payload,
      });
    }
    return this.findByKey(sectionKey);
  },
};

export default LandingContent;
