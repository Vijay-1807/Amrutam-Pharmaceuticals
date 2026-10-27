const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

module.exports = async function globalSetup() {
  const ep = require('embedded-postgres');
  const EmbeddedPostgres = ep.default || ep;

  const state = {
    port: 5433,
    user: 'postgres',
    password: 'postgres',
    database: 'telemedicine_test',
    pgDir: path.join(__dirname, '.pgdata'),
  };

  const pg = new EmbeddedPostgres({
    databaseDir: state.pgDir,
    user: state.user,
    password: state.password,
    port: state.port,
    persistent: true,
    onLog: () => {},
    onError: () => {},
  });

  await pg.initialise();
  await pg.start();
  try {
    await pg.createDatabase(state.database);
  } catch (e) {
    if (!String(e).includes('already exists')) throw e;
  }

  const databaseUrl = `postgresql://${state.user}:${state.password}@127.0.0.1:${state.port}/${state.database}?schema=public`;

  execSync('npx prisma migrate deploy', {
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'pipe',
  });

  // Optional embedded Redis; fall back gracefully when unavailable.
  let redisServer = null;
  try {
    const { RedisMemoryServer } = require('redis-memory-server');
    redisServer = new RedisMemoryServer({ instance: { port: 6390, ip: '127.0.0.1' } });
    await redisServer.start();
    const info = await redisServer.getInstanceInfo();
    state.redisHost = await redisServer.getHost();
    state.redisPort = String(await redisServer.getPort());
    state.redisPid = info?.childProcess?.pid ? String(info.childProcess.pid) : null;
  } catch (e) {
    // eslint-disable-next-line no-console
    console.warn('[globalSetup] Redis unavailable, redis-backed assertions will be skipped:', String(e).slice(0, 200));
    redisServer = null;
  }

  fs.writeFileSync(path.join(__dirname, 'db-state.json'), JSON.stringify(state));
};
