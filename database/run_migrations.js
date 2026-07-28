import mysql from 'mysql2/promise';

const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true,
};

async function run() {
  const conn = await mysql.createConnection(config);
  await conn.query('USE kumocoders');

  // Migration 008 - post_reactions table
  await conn.query(`
    CREATE TABLE IF NOT EXISTS post_reactions (
      id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      user_id     INT UNSIGNED NOT NULL,
      post_id     INT UNSIGNED NOT NULL,
      reaction    VARCHAR(10) NOT NULL,
      created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY unique_reaction (user_id, post_id, reaction),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (post_id) REFERENCES community_posts(id) ON DELETE CASCADE
    ) ENGINE=InnoDB
  `);
  console.log('Migration 008: post_reactions table OK');

  // Migration 009 - status column
  const [rows] = await conn.query(
    "SELECT COUNT(*) AS cnt FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = 'kumocoders' AND TABLE_NAME = 'community_posts' AND COLUMN_NAME = 'status'"
  );
  if (rows[0].cnt === 0) {
    await conn.query(
      "ALTER TABLE community_posts ADD COLUMN status ENUM('draft','published') NOT NULL DEFAULT 'published' AFTER tags"
    );
    console.log('Migration 009: status column added');
  } else {
    console.log('Migration 009: status column already exists');
  }

  await conn.end();
  console.log('All migrations complete!');
}

run().catch((err) => {
  console.error('Migration error:', err.message);
  process.exit(1);
});
