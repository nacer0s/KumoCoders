import db from '../config/db.js';

const PostTemplate = {
  async findAll() {
    return db('post_templates').select('*').orderBy('name');
  },

  async create(data) {
    const [id] = await db('post_templates').insert(data);
    return db('post_templates').where({ id }).first();
  },

  async remove(id) {
    return db('post_templates').where({ id }).del();
  },
};

export default PostTemplate;
