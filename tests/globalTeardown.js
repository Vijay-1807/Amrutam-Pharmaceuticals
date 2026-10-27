const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function pidListeningOnPort(port) {
  try {
    const out = execSync(`netstat -ano -p tcp | findstr /R /C:":${port} "`, { encoding: 'utf8' });
    const line = out.split('\n').find((l) => l.includes('LISTENING'));
    if (line) return line.trim().split(/\s+/).pop();
  } catch {}
  return null;
}

module.exports = async function globalTeardown() {
  const stateFile = path.join(__dirname, 'db-state.json');
  let state = {};
  if (fs.existsSync(stateFile)) {
    state = JSON.parse(fs.readFileSync(stateFile, 'utf8'));
  }

  const killPort = (port) => {
    const pid = state.redisPid && String(port) === String(state.redisPort) ? state.redisPid : pidListeningOnPort(port);
    if (pid) {
      try { execSync(`taskkill /F /T /PID ${pid}`, { stdio: 'pipe' }); } catch {}
    }
  };

  killPort(5433);
  if (state.redisPort) killPort(state.redisPort);

  if (fs.existsSync(stateFile)) fs.unlinkSync(stateFile);
  try {
    fs.rmSync(path.join(__dirname, '.pgdata'), { recursive: true, force: true, maxRetries: 3 });
  } catch {}
};
