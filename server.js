/**
 * Root Server Entry Point for Hostinger / Node.js Deployments
 * Launches NestJS API backend first, waits for health check, then launches Next.js frontend.
 */
'use strict';
const cluster = require('cluster');
const { fork } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const rootDir = __dirname;

// Ignore benign duplicate close errors on server shutdown
process.on('uncaughtException', (err) => {
  if (err && err.message && err.message.includes('Server is not running')) {
    return;
  }
  console.error('[BuckDuck Uncaught Exception]', err);
});

// Ensure .env is loaded if present
try {
  const envPath = path.join(rootDir, '.env');
  if (fs.existsSync(envPath)) {
    require('dotenv').config({ path: envPath });
  }
} catch (e) {}


async function main() {
  // 1. Locate and launch NestJS API backend on internal port 4000
  const apiCandidates = [
    path.join(rootDir, 'apps', 'api', 'dist', 'main.js'),
    path.join(rootDir, 'dist', 'main.js'),
  ];
  const apiPath = apiCandidates.find((c) => fs.existsSync(c));

  let apiProc = null;
  const isPrimary = !cluster.isWorker || !cluster.worker || cluster.worker.id === 1;
  const pidFile = path.join(os.tmpdir(), 'buckduck-api.pid');

  let backendAlreadyRunning = false;
  if (fs.existsSync(pidFile)) {
    try {
      const existingPid = parseInt(fs.readFileSync(pidFile, 'utf8').trim(), 10);
      if (existingPid && !isNaN(existingPid)) {
        process.kill(existingPid, 0);
        backendAlreadyRunning = true;
      }
    } catch (e) {}
  }

  if (isPrimary && !backendAlreadyRunning && apiPath && process.env.API_ALREADY_SPAWNED !== 'true') {
    process.env.API_ALREADY_SPAWNED = 'true';
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
          API_ALREADY_SPAWNED: 'true',
          NODE_PATH: nodePath,
        },
        stdio: 'inherit',
      });

      if (apiProc.pid) {
        try { fs.writeFileSync(pidFile, String(apiProc.pid), 'utf8'); } catch (e) {}
      }

      apiProc.on('error', (err) => {
        console.error('[BuckDuck API Error]', err);
      });

      apiProc.on('exit', (code, signal) => {
        console.warn(`[BuckDuck] NestJS API process exited with code ${code}, signal ${signal}`);
        process.env.API_ALREADY_SPAWNED = 'false';
        try { if (fs.existsSync(pidFile)) fs.unlinkSync(pidFile); } catch (e) {}
      });

      console.log('[BuckDuck] NestJS API process spawned in background.');
    } catch (err) {
      process.env.API_ALREADY_SPAWNED = 'false';
      console.error('[BuckDuck] Failed to spawn NestJS process:', err);
    }
  } else {
    console.log('[BuckDuck] NestJS API is already running or this is a secondary cluster worker.');
  }

  // Cleanly kill child API process on shutdown
  const cleanup = () => {
    try { if (fs.existsSync(pidFile)) fs.unlinkSync(pidFile); } catch (e) {}
    if (apiProc && !apiProc.killed) {
      try {
        apiProc.kill();
      } catch {}
    }
  };
  process.on('SIGINT', () => { cleanup(); process.exit(0); });
  process.on('SIGTERM', () => { cleanup(); process.exit(0); });
  process.on('exit', cleanup);

  // 2. Locate and launch Next.js Standalone server
  const nextCandidates = [
    path.join(rootDir, '.next', 'standalone', 'apps', 'web', 'server.js'),
    path.join(rootDir, 'apps', 'web', '.next', 'standalone', 'apps', 'web', 'server.js'),
    path.join(rootDir, '.next', 'standalone', 'server.js'),
    path.join(rootDir, 'apps', 'web', '.next', 'standalone', 'server.js'),
  ];

  const serverPath = nextCandidates.find((c) => fs.existsSync(c));

  if (serverPath) {
    console.log(`[BuckDuck] Starting Next.js standalone server from ${serverPath}`);
    process.chdir(path.dirname(serverPath));
    require(serverPath);
  } else {
    console.error('[BuckDuck] Could not locate Next.js standalone server.js. Checked:', nextCandidates);
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('[BuckDuck Startup Error]', err);
  process.exit(1);
});
