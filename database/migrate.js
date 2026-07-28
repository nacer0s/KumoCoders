import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  multipleStatements: true,
};

const FILES = [
  'schema.sql',
  'migration_001.sql',
  'migration_002.sql',
  'migration_003.sql',
  'migration_004.sql',
  'migration_005.sql',
  'migration_006.sql',
  'migration_007.sql',
];

async function migrate() {
  const connection = await mysql.createConnection(DB_CONFIG);

  try {
    for (const file of FILES) {
      const filePath = path.join(__dirname, file);
      if (!fs.existsSync(filePath)) {
        console.log(`  ⏭️  ${file} — not found, skipping`);
        continue;
      }
      let sql = fs.readFileSync(filePath, 'utf8');
      console.log(`  ▶️  Running ${file}...`);
      if (file === 'schema.sql') {
        sql = sql.replace('INSERT INTO roles', 'INSERT IGNORE INTO roles');
      }
      await connection.query(sql);
      console.log(`  ✅ ${file} done`);
    }
    console.log('\n  ✅ All migrations complete');
  } catch (err) {
    console.error('\n  ❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

migrate();
