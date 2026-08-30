import pg from 'pg';

const { Pool } = pg;

let pool;

export function databaseEnabled() {
  return Boolean(process.env.DATABASE_URL) && process.env.DEMO_MODE !== 'true';
}

function getPool() {
  if (!pool) {
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) throw new Error('DATABASE_URL is not configured.');

    const isHostedPostgres = /supabase|neon|render\.com/i.test(databaseUrl);
    pool = new Pool({
      connectionString: databaseUrl,
      max: 5,
      idleTimeoutMillis: 10_000,
      connectionTimeoutMillis: 10_000,
      ssl: process.env.DATABASE_SSL === 'false'
        ? false
        : isHostedPostgres
          ? { rejectUnauthorized: false }
          : undefined
    });

    pool.on('error', (error) => {
      console.error('Unexpected PostgreSQL pool error:', error.message);
    });
  }
  return pool;
}

export async function query(text, values = []) {
  return getPool().query(text, values);
}

export async function withTransaction(callback) {
  const client = await getPool().connect();
  try {
    await client.query('begin');
    const result = await callback(client);
    await client.query('commit');
    return result;
  } catch (error) {
    await client.query('rollback');
    throw error;
  } finally {
    client.release();
  }
}

export async function closeDatabase() {
  if (pool) await pool.end();
}
