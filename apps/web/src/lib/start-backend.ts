import path from 'path';
import fs from 'fs';
import net from 'net';
import { fork } from 'child_process';

declare global {
  // eslint-disable-next-line no-var
  var __BUCKDUCK_API_STARTED: boolean | undefined;
}

let backendProcess: any = null;

function isPortOpen(port: number, host = '127.0.0.1'): Promise<boolean> {
  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(350);
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
    socket.connect(port, host);
  });
}

export async function ensureBackendRunning() {
  if (globalThis.__BUCKDUCK_API_STARTED || process.env.API_ALREADY_SPAWNED === 'true') {
    return;
  }

  // Check if backend is already listening on internal port 4000
  const alreadyListening = await isPortOpen(4000);
  if (alreadyListening) {
    console.log('[Instrumentation] Backend is already running on port 4000.');
    globalThis.__BUCKDUCK_API_STARTED = true;
    process.env.API_ALREADY_SPAWNED = 'true';
    return;
  }

  globalThis.__BUCKDUCK_API_STARTED = true;

  const cwd = process.cwd();
  const candidates = [
    path.resolve(cwd, 'apps/api/dist/main.js'),
    path.resolve(cwd, 'dist/main.js'),
    path.resolve(cwd, '../api/dist/main.js'),
    path.resolve(cwd, '../../apps/api/dist/main.js'),
    path.resolve(cwd, '.next/standalone/apps/api/dist/main.js'),
    path.resolve(__dirname, '../../../../apps/api/dist/main.js'),
    path.resolve(__dirname, '../../../apps/api/dist/main.js'),
    path.resolve(__dirname, '../../api/dist/main.js'),
  ];

  const apiPath = candidates.find((c) => fs.existsSync(c));

  if (!apiPath) {
    console.warn('[Instrumentation] Warning: Could not locate NestJS dist/main.js. Checked:', candidates);
    return;
  }

  console.log(`[Instrumentation] Booting NestJS API from ${apiPath}...`);
  try {
    const searchDirs = [
      path.resolve(cwd, 'node_modules'),
      path.resolve(cwd, '../node_modules'),
      path.resolve(cwd, '../../node_modules'),
      path.resolve(cwd, 'apps/api/node_modules'),
      path.resolve(cwd, 'apps/web/node_modules'),
      path.resolve(path.dirname(apiPath), '../../node_modules'),
      path.resolve(path.dirname(apiPath), '../../../node_modules'),
    ];
    const existingNodePath = process.env.NODE_PATH || '';
    const nodePath = Array.from(new Set([...searchDirs, existingNodePath])).filter(Boolean).join(path.delimiter);

    backendProcess = fork(apiPath, [], {
      env: {
        ...process.env,
        PORT: '4000',
        API_PORT: '4000',
        API_ALREADY_SPAWNED: 'true',
        NODE_PATH: nodePath,
      },
      stdio: 'inherit',
    });

    backendProcess.on('error', (err: any) => {
      console.error('[Instrumentation Backend Error]', err);
    });

    backendProcess.on('exit', (code: number, signal: string) => {
      console.warn(`[Instrumentation] Backend exited with code ${code}, signal ${signal}`);
      globalThis.__BUCKDUCK_API_STARTED = false;
      process.env.API_ALREADY_SPAWNED = 'false';
    });

    console.log('[Instrumentation] NestJS API process spawned on internal port 4000.');
  } catch (err) {
    console.error('[Instrumentation] Failed to fork backend:', err);
  }
}
