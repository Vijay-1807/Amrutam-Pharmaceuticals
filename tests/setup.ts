const fs = require('fs');
const path = require('path');

const stateFile = path.join(__dirname, 'db-state.json');

if (!fs.existsSync(stateFile)) {
  throw new Error('db-state.json missing — jest globalSetup did not run');
}
const state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = `postgresql://${state.user}:${state.password}@127.0.0.1:${state.port}/${state.database}?schema=public`;
process.env.JWT_ACCESS_SECRET = 'test-access-secret-0123456789abcdef0123456789abcdef';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-0123456789abcdef0123456789abcdef';
process.env.ENCRYPTION_KEY = 'test-encryption-key-0123456789abcdef';
process.env.RATE_LIMIT_MAX_REQUESTS = '1000000';
process.env.LOG_LEVEL = 'error';

if (state.redisPort) {
  process.env.REDIS_HOST = state.redisHost || '127.0.0.1';
  process.env.REDIS_PORT = state.redisPort;
}

module.exports = {};
