/**
 * Root Server Entry Point for Hostinger / Node.js Deployments
 * Launches both the NestJS API backend and the Next.js standalone frontend.
 */
const { fork } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = __dirname;

// Ensure .env is loaded if present
try {
  const envPath = path.join(rootDir, '.env');
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
  }
} catch (e) {}

// 1. Locate and launch NestJS API backend on internal port 4000
const apiCandidates = [
  path.join(rootDir, 'apps', 'api', 'dist', 'main.js'),
  path.join(rootDir, 'dist', 'main.js'),
];

const apiPath = apiCandidates.find((c) => fs.existsSync(c));

let apiProc = null;
if (apiPath) {
  console.log(`[BuckDuck] Launching NestJS API backend from ${apiPath}...`);
  try {
    const rootNodeModules = path.join(rootDir, 'node_modules');
    const apiNodeModules = path.join(rootDir, 'apps', 'api', 'node_modules');
    const webNodeModules = path.join(rootDir, 'apps', 'web', 'node_modules');
    const nodePath = [rootNodeModules, apiNodeModules, webNodeModules, process.env.NODE_PATH || ''].filter(Boolean).join(path.delimiter);

    apiProc = fork(apiPath, [], {
      env: {
        ...process.env,
        PORT: '4000',
        API_PORT: '4000',
        NODE_PATH: nodePath,
      },
      stdio: 'inherit',
    });
    apiProc.on('error', (err) => {
      console.error('[BuckDuck API Error]', err);
    });
    apiProc.on('exit', (code, signal) => {
      console.warn(`[BuckDuck] NestJS API process exited with code ${code}, signal ${signal}`);
    });
    console.log('[BuckDuck] NestJS API process spawned successfully on internal port 4000.');
    process.env.API_ALREADY_SPAWNED = 'true';
  } catch (err) {
    console.error('[BuckDuck] Failed to spawn NestJS process:', err);
  }
} else {
  console.warn('[BuckDuck] Warning: NestJS API build (dist/main.js) not found. Checked:', apiCandidates);
}

// Cleanly kill child API process on shutdown
const cleanup = () => {
  if (apiProc && !apiProc.killed) {
    try {
      apiProc.kill();
    } catch {}
  }
};
process.on('SIGINT', () => { cleanup(); process.exit(0); });
process.on('SIGTERM', () => { cleanup(); process.exit(0); });
process.on('exit', cleanup);

// 2. Locate and launch Next.js Standalone server on Hostinger's assigned public PORT
const nextCandidates = [
  path.join(rootDir, '.next', 'standalone', 'server.js'),
  path.join(rootDir, '.next', 'standalone', 'apps', 'web', 'server.js'),
  path.join(rootDir, 'apps', 'web', '.next', 'standalone', 'server.js'),
  path.join(rootDir, 'apps', 'web', '.next', 'standalone', 'apps', 'web', 'server.js'),
];

const serverPath = nextCandidates.find((c) => fs.existsSync(c));

if (serverPath) {
  console.log(`[BuckDuck] Starting Next.js standalone server from ${serverPath}`);
  process.chdir(path.dirname(serverPath));
  require(serverPath);
} else {
  console.error('[BuckDuck] Could not locate Next.js standalone server.js. Available candidates checked:', nextCandidates);
  process.exit(1);
}
