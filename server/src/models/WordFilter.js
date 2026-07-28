import db from '../config/db.js';

const WordFilter = {
  async findAll() {
    return db('word_filters').select('*').orderBy('created_at', 'desc');
  },

  async create(data) {
    const [id] = await db('word_filters').insert(data);
    return db('word_filters').where({ id }).first();
  },

  async remove(id) {
    return db('word_filters').where({ id }).del();
  },

  async checkContent(text) {
    const filters = await db('word_filters').select('*');
    let filtered = text;
    let flagged = false;
    for (const f of filters) {
      let match;
      if (f.is_regex) {
        const re = new RegExp(f.pattern, 'gi');
        if (re.test(filtered)) {
          if (f.action === 'flag') { flagged = true; continue; }
          if (f.action === 'block') return { blocked: true, reason: `Content matched filter: ${f.pattern}` };
          filtered = filtered.replace(re, f.replacement);
        }
      } else {
        const lower = filtered.toLowerCase();
        const idx = lower.indexOf(f.pattern.toLowerCase());
        if (idx !== -1) {
          if (f.action === 'flag') { flagged = true; continue; }
          if (f.action === 'block') return { blocked: true, reason: `Content matched filter: ${f.pattern}` };
          const re = new RegExp(f.pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
          filtered = filtered.replace(re, f.replacement);
        }
      }
    }
    return { blocked: false, filtered, flagged };
  },
};

export default WordFilter;
