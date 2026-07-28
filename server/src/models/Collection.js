import db from '../config/db.js';

const Collection = {
  async findByUser(userId) {
    return db('collections').where({ user_id: userId }).orderBy('created_at', 'desc');
  },

  async findById(id) {
    return db('collections').where({ id }).first();
  },

  async create(data) {
    const [id] = await db('collections').insert({
      user_id: data.userId,
      name: data.name,
      description: data.description || null,
      is_public: data.isPublic ? 1 : 0,
    });
    return db('collections').where({ id }).first();
  },

  async update(id, data) {
    const updates = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.description !== undefined) updates.description = data.description;
    if (data.isPublic !== undefined) updates.is_public = data.isPublic ? 1 : 0;
    if (Object.keys(updates).length) await db('collections').where({ id }).update(updates);
    return db('collections').where({ id }).first();
  },

  async remove(id) {
    return db('collections').where({ id }).del();
  },

  async addPost(collectionId, postId) {
    await db('collection_posts').insert({ collection_id: collectionId, post_id: postId });
  },

  async removePost(collectionId, postId) {
    return db('collection_posts').where({ collection_id: collectionId, post_id: postId }).del();
  },

  async getPosts(collectionId, { page = 1, limit = 50 } = {}) {
    const offset = (page - 1) * limit;
    const [{ count }] = await db('collection_posts').where({ collection_id: collectionId }).count('* as count');
    const items = await db('collection_posts')
      .join('community_posts', 'collection_posts.post_id', 'community_posts.id')
      .where('collection_posts.collection_id', collectionId)
      .orderBy('collection_posts.added_at', 'desc')
      .limit(limit)
      .offset(offset);
    return { items, total: count };
  },

  async checkPostInCollections(postId, userId) {
    const collections = await db('collections')
      .join('collection_posts', 'collections.id', 'collection_posts.collection_id')
      .where('collections.user_id', userId)
      .andWhere('collection_posts.post_id', postId)
      .select('collections.id', 'collections.name');
    return collections;
  },
};

export default Collection;
