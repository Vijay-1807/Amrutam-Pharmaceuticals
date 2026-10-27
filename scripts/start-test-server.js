/* eslint-disable no-console */
const path = require('path');
const { execSync } = require('child_process');

async function startServer() {
  console.log('🚀 Initializing self-contained test environment for Playwright...');

  // 1. Embedded Postgres
  const ep = require('embedded-postgres');
  const EmbeddedPostgres = ep.default || ep;

  const pgState = {
    port: 5433,
    user: 'postgres',
    password: 'postgres',
    database: 'telemedicine_test',
    pgDir: path.join(__dirname, '../tests/.pgdata'),
  };

  const pg = new EmbeddedPostgres({
    databaseDir: pgState.pgDir,
    user: pgState.user,
    password: pgState.password,
    port: pgState.port,
    persistent: true,
    onLog: () => {},
    onError: () => {},
  });

  try {
    await pg.initialise();
  } catch {}
  try {
    await pg.start();
  } catch {}
  try {
    await pg.createDatabase(pgState.database);
  } catch (e) {
    if (!String(e).includes('already exists')) {
      console.warn('DB creation note:', e.message);
    }
  }

  const databaseUrl = `postgresql://${pgState.user}:${pgState.password}@127.0.0.1:${pgState.port}/${pgState.database}?schema=public`;

  // 2. Embedded Redis
  let redisPort = '6390';
  let redisServer = null;
  try {
    const { RedisMemoryServer } = require('redis-memory-server');
    redisServer = new RedisMemoryServer({ instance: { port: 6390, ip: '127.0.0.1' } });
    await redisServer.start();
    redisPort = String(await redisServer.getPort());
    console.log(`✓ RedisMemoryServer running on port ${redisPort}`);
  } catch (e) {
    console.warn('[Redis] Falling back to offline mode or existing redis:', e.message);
  }

  // Set ENV vars before loading app
  process.env.DATABASE_URL = databaseUrl;
  process.env.REDIS_HOST = '127.0.0.1';
  process.env.REDIS_PORT = redisPort;
  process.env.PORT = '3000';
  process.env.NODE_ENV = 'development';
  process.env.JWT_ACCESS_SECRET = '441432fed3b4074d0e61cc6e756897753d67b10e845e5c9044944e91d8e44178';
  process.env.JWT_REFRESH_SECRET = 'db46aaf061d703ce34a6ed2d0f6a5860e06dbef49d245532b5bcec6028b63a64';
  process.env.ENCRYPTION_KEY = '5d620dcb43424ccb5ec659a1bbce6775';

  // 3. Migrate database
  try {
    console.log('📦 Applying Prisma migrations...');
    execSync('npx prisma migrate deploy', {
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'pipe',
    });
    console.log('✓ Migrations applied');
  } catch (err) {
    console.error('Migration notice:', err.message);
  }

  // 4. Seed demo data (doctors, admin, etc.)
  try {
    console.log('🌱 Seeding database...');
    execSync('node scripts/seed.js', {
      cwd: path.join(__dirname, '..'),
      env: { ...process.env, DATABASE_URL: databaseUrl },
      stdio: 'pipe',
    });
    console.log('✓ Seed completed');
  } catch (err) {
    console.log('Seed notice:', err.message);
  }

  // 5. Build portal
  try {
    require('./build-portal.js');
  } catch (e) {
    console.warn('Build portal notice:', e.message);
  }

  // 6. Start server
  require('ts-node/register');
  require('../src/server.ts');
  console.log('🌿 Telemedicine server is live at http://localhost:3000');

  const cleanup = async () => {
    console.log('Shutting down test server...');
    if (redisServer) {
      try { await redisServer.stop(); } catch {}
    }
    process.exit(0);
  };

  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}

startServer().catch((err) => {
  console.error('Failed to start test server:', err);
  process.exit(1);
});
