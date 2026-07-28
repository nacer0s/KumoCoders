import db from '../config/db.js';

const PushSubscription = {
  async findByUser(userId) {
    return db('push_subscriptions').where({ user_id: userId });
  },

  async create(data) {
    const [id] = await db('push_subscriptions').insert({
      user_id: data.userId,
      endpoint: data.endpoint,
      keys_auth: data.keys.auth,
      keys_p256dh: data.keys.p256dh,
    });
    return db('push_subscriptions').where({ id }).first();
  },

  async remove(endpoint) {
    return db('push_subscriptions').where({ endpoint }).del();
  },

  async removeByUser(userId) {
    return db('push_subscriptions').where({ user_id: userId }).del();
  },
};

export default PushSubscription;
