/**
 * Root Server Entry Point for Hostinger / Node.js Deployments
 * Launches NestJS API backend first, waits for health check, then launches Next.js frontend.
 */
'use strict';
const { fork } = require('child_process');
const fs = require('fs');
const http = require('http');
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

async function waitForBackend(port = 4000, maxWaitMs = 30000) {
  const start = Date.now();
  while (Date.now() - start < maxWaitMs) {
    const ready = await new Promise((resolve) => {
      const req = http.get(`http://127.0.0.1:${port}/api/healthz`, (res) => {
        resolve(res.statusCode === 200);
      });
      req.on('error', () => resolve(false));
      req.setTimeout(800, () => {
        req.destroy();
        resolve(false);
      });
    });
    if (ready) return true;
    await new Promise((r) => setTimeout(r, 250));
  }
  return false;
}

async function main() {
  // 1. Locate and launch NestJS API backend on internal port 4000
  const apiCandidates = [
    path.join(rootDir, 'apps', 'api', 'dist', 'main.js'),
    path.join(rootDir, 'dist', 'main.js'),
  ];
  const apiPath = apiCandidates.find((c) => fs.existsSync(c));

  let apiProc = null;
  if (apiPath && process.env.API_ALREADY_SPAWNED !== 'true') {
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

      apiProc.on('error', (err) => {
        console.error('[BuckDuck API Error]', err);
      });

      apiProc.on('exit', (code, signal) => {
        console.warn(`[BuckDuck] NestJS API process exited with code ${code}, signal ${signal}`);
        process.env.API_ALREADY_SPAWNED = 'false';
      });

      // Wait for backend to be ready before starting Next.js
      console.log('[BuckDuck] Waiting for NestJS API to be healthy on port 4000...');
      const ready = await waitForBackend(4000, 30000);
      if (ready) {
        console.log('[BuckDuck] NestJS API is healthy and connected to database.');
      } else {
        console.warn('[BuckDuck] NestJS API did not respond to health check within 30s; proceeding with Next.js startup.');
      }
    } catch (err) {
      process.env.API_ALREADY_SPAWNED = 'false';
      console.error('[BuckDuck] Failed to spawn NestJS process:', err);
    }
  } else {
    console.log('[BuckDuck] NestJS API is already running or dist not found.');
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
