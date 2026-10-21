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
  const envPaths = [
    path.join(rootDir, '.env'),
    path.join(rootDir, '..', '.env'),
    path.join(rootDir, '..', '..', '.env'),
    path.join(rootDir, '..', '..', '..', '.env'),
    path.join(rootDir, '..', '..', 'config', '.env'),
    path.join(rootDir, '..', '..', '..', 'config', '.env'),
    '/home/u595725627/domains/buckduck.hirazahid.com/hbuilds/config/.env',
    '/home/u595725627/domains/buckduck.hirazahid.com/public_html/.env',
  ];
  for (const ep of envPaths) {
    if (fs.existsSync(ep)) {
      require('dotenv').config({ path: ep });
    }
  }
} catch (e) {}


function isBackendListening(port = 4000) {
  return new Promise((resolve) => {
    const socket = new (require('net')).Socket();
    socket.setTimeout(250);
    socket.once('connect', () => {
      socket.destroy();
      resolve(true);
    });
    socket.once('timeout', () => {
      socket.destroy();
      resolve(false);
    });
    socket.once('error', () => {
      socket.destroy();
      resolve(false);
    });
    socket.connect(port, '127.0.0.1');
  });
}

async function main() {
  // 1. Locate and launch NestJS API backend on internal port 4000
  const apiCandidates = [
    path.join(rootDir, 'apps', 'api', 'dist', 'main.js'),
    path.join(rootDir, 'dist', 'main.js'),
  ];
  const apiPath = apiCandidates.find((c) => fs.existsSync(c));

  let apiProc = null;
  const backendAlreadyListening = await isBackendListening(4000);
  const isPrimary = !cluster.isWorker || !cluster.worker || cluster.worker.id === 1;

  const spawnApi = () => {
    if (process.env.APP_SHUTTING_DOWN) return;
    try {
      const rootNodeModules = path.join(rootDir, 'node_modules');
      const apiNodeModules = path.join(rootDir, 'apps', 'api', 'node_modules');
      const webNodeModules = path.join(rootDir, 'apps', 'web', 'node_modules');
      const nodePath = [rootNodeModules, apiNodeModules, webNodeModules, process.env.NODE_PATH || ''].filter(Boolean).join(path.delimiter);

      console.log(`[BuckDuck] Launching NestJS API backend from ${apiPath}...`);
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

      apiProc.on('exit', async (code, signal) => {
        console.warn(`[BuckDuck] NestJS API process exited with code ${code}, signal ${signal}`);
        process.env.API_ALREADY_SPAWNED = 'false';
        if (!process.env.APP_SHUTTING_DOWN) {
          await new Promise((r) => setTimeout(r, 800));
          const alive = await isBackendListening(4000);
          if (!alive) {
            console.log('[BuckDuck] Port 4000 is offline; auto-restarting NestJS backend...');
            spawnApi();
          }
        }
      });

      console.log('[BuckDuck] NestJS API process spawned in background.');
    } catch (err) {
      process.env.API_ALREADY_SPAWNED = 'false';
      console.error('[BuckDuck] Failed to spawn NestJS process:', err);
    }
  };

  if (isPrimary && !backendAlreadyListening && apiPath) {
    spawnApi();
  } else if (backendAlreadyListening) {
    console.log('[BuckDuck] NestJS API is already running on port 4000.');
  } else {
    console.log('[BuckDuck] Secondary cluster worker: skipping backend spawn.');
  }

  // Cleanly kill child API process on shutdown
  const cleanup = () => {
    process.env.APP_SHUTTING_DOWN = 'true';
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
