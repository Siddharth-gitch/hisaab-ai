import 'dotenv/config';
import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const root = path.resolve(path.dirname(__filename), '..');
const migrationsPath = path.join(root, 'db', 'migrations');

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is missing. Add it to .env before running npm run db:migrate.');
  process.exit(1);
}

const isHostedPostgres = /supabase|neon|render\.com/i.test(process.env.DATABASE_URL);
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_SSL === 'false'
    ? false
    : isHostedPostgres
      ? { rejectUnauthorized: false }
      : undefined
});

try {
  await client.connect();
  await client.query(`
    create table if not exists schema_migrations (
      filename text primary key,
      applied_at timestamptz not null default now()
    )
  `);

  const files = (await fs.readdir(migrationsPath))
    .filter((file) => file.endsWith('.sql'))
    .sort();

  for (const filename of files) {
    const existing = await client.query('select 1 from schema_migrations where filename = $1', [filename]);
    if (existing.rowCount) {
      console.log(`skip ${filename}`);
      continue;
    }

    const sql = await fs.readFile(path.join(migrationsPath, filename), 'utf8');
    await client.query('begin');
    try {
      await client.query(sql);
      await client.query('insert into schema_migrations (filename) values ($1)', [filename]);
      await client.query('commit');
      console.log(`applied ${filename}`);
    } catch (error) {
      await client.query('rollback');
      throw error;
    }
  }

  console.log('Database is up to date.');
} catch (error) {
  console.error('Migration failed:', error.message);
  process.exitCode = 1;
} finally {
  await client.end().catch(() => {});
}
