/**
 * Root Server Entry Point for Hostinger / Node.js Deployments
 */
const fs = require('fs');
const path = require('path');

const candidates = [
  path.join(__dirname, '.next', 'standalone', 'apps', 'web', 'server.js'),
  path.join(__dirname, '.next', 'standalone', 'server.js'),
  path.join(__dirname, 'apps', 'web', '.next', 'standalone', 'apps', 'web', 'server.js'),
  path.join(__dirname, 'apps', 'web', '.next', 'standalone', 'server.js'),
];

let serverPath = null;
for (const cand of candidates) {
  if (fs.existsSync(cand)) {
    serverPath = cand;
    break;
  }
}

if (serverPath) {
  console.log(`[BuckDuck] Starting Next.js standalone server from ${serverPath}`);
  // Change working directory to the directory of the server file so it finds its .next directory
  process.chdir(path.dirname(serverPath));
  require(serverPath);
} else {
  console.error('[BuckDuck] Could not locate Next.js standalone server.js. Available candidates checked:', candidates);
  process.exit(1);
}
