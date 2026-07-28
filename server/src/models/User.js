import db from '../config/db.js';

const User = {
  async findByEmail(email) {
    return db('users').where({ email }).first();
  },

  async findById(id) {
    return db('users')
      .select(
        'users.id',
        'users.username',
        'users.email',
        'users.display_name',
        'users.avatar_url',
        'users.role_id',
        'users.is_active',
        'users.is_verified',
        'users.verified_at',
        'users.verified_by',
        'users.created_at',
        'roles.name as role_name'
      )
      .join('roles', 'users.role_id', 'roles.id')
      .where('users.id', id)
      .first();
  },

  async create(data) {
    const [id] = await db('users').insert({
      username: data.username,
      email: data.email,
      password_hash: data.passwordHash,
      display_name: data.displayName || data.username,
      role_id: data.roleId || 2,
    });
    return this.findById(id);
  },

  async findByUsername(username) {
    return db('users').where({ username }).first();
  },

  async searchByUsername(query, limit = 10) {
    return db('users')
      .select('id', 'username', 'display_name', 'avatar_url', 'role_id', 'is_verified')
      .where('username', 'like', `%${query}%`)
      .orWhere('display_name', 'like', `%${query}%`)
      .orderByRaw('CASE WHEN username = ? THEN 0 WHEN username LIKE ? THEN 1 ELSE 2 END', [query, `${query}%`])
      .limit(limit);
  },

  async update(id, data) {
    await db('users').where({ id }).update(data);
    return this.findById(id);
  },

  async delete(id) {
    return db('users').where({ id }).del();
  },

  async findAll(page = 1, limit = 20) {
    const offset = (page - 1) * limit;
    return db('users')
      .select(
        'users.id',
        'users.username',
        'users.email',
        'users.display_name',
        'users.avatar_url',
        'users.role_id',
        'users.is_active',
        'users.is_verified',
        'users.created_at',
        'roles.name as role_name'
      )
      .join('roles', 'users.role_id', 'roles.id')
      .orderBy('users.created_at', 'desc')
      .limit(limit)
      .offset(offset);
  },

  async verify(id, adminId) {
    await db('users').where({ id }).update({
      is_verified: 1,
      verified_at: db.fn.now(),
      verified_by: adminId,
    });
    return this.findById(id);
  },

  async unverify(id) {
    await db('users').where({ id }).update({
      is_verified: 0,
      verified_at: null,
      verified_by: null,
    });
    return this.findById(id);
  },
};

export default User;
