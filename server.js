/**
 * Root Server Entry Point for Hostinger / Node.js Deployments
 * Launches both the NestJS API backend and the Next.js standalone frontend.
 */
const { fork } = require('child_process');
const fs = require('fs');
const path = require('path');

const rootDir = __dirname;

// 1. Locate and launch NestJS API backend on internal port 4000
const apiCandidates = [
  path.join(rootDir, 'apps', 'api', 'dist', 'main.js'),
  path.join(rootDir, 'dist', 'main.js'),
];

const apiPath = apiCandidates.find((c) => fs.existsSync(c));

if (apiPath) {
  console.log(`[BuckDuck] Launching NestJS API backend from ${apiPath}...`);
  try {
    const apiProc = fork(apiPath, [], {
      env: {
        ...process.env,
        PORT: '4000',
        API_PORT: '4000',
      },
      stdio: 'inherit',
    });
    apiProc.on('error', (err) => {
      console.error('[BuckDuck API Error]', err);
    });
    console.log('[BuckDuck] NestJS API process spawned successfully on internal port 4000.');
  } catch (err) {
    console.error('[BuckDuck] Failed to spawn NestJS process:', err);
  }
} else {
  console.warn('[BuckDuck] Warning: NestJS API build (dist/main.js) not found. Checked:', apiCandidates);
}

// 2. Locate and launch Next.js Standalone server on Hostinger's assigned public PORT
const nextCandidates = [
  path.join(rootDir, '.next', 'standalone', 'apps', 'web', 'server.js'),
  path.join(rootDir, '.next', 'standalone', 'server.js'),
  path.join(rootDir, 'apps', 'web', '.next', 'standalone', 'apps', 'web', 'server.js'),
  path.join(rootDir, 'apps', 'web', '.next', 'standalone', 'server.js'),
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
