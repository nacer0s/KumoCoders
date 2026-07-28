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

async function seed() {
  const filePath = path.join(__dirname, 'seed.sql');
  if (!fs.existsSync(filePath)) {
    console.error('seed.sql not found');
    process.exit(1);
  }

  const connection = await mysql.createConnection(DB_CONFIG);

  try {
    const sql = fs.readFileSync(filePath, 'utf8');
    console.log('  ▶️  Running seed.sql...');
    await connection.query(sql);
    console.log('  ✅ Seed data inserted');
    console.log('\n  Default admin login:');
    console.log('    Email:    admin@kumocoders.dev');
    console.log('    Password: admin123');
  } catch (err) {
    console.error('\n  ❌ Seed failed:', err.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

seed();
