import path from 'path';
import fs from 'fs';
import { fork } from 'child_process';

declare global {
  // eslint-disable-next-line no-var
  var __BUCKDUCK_API_STARTED: boolean | undefined;
}

let backendProcess: any = null;

export function ensureBackendRunning() {
  if (globalThis.__BUCKDUCK_API_STARTED) {
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
    const rootNodeModules = path.resolve(cwd, 'node_modules');
    const apiNodeModules = path.resolve(cwd, 'apps/api/node_modules');
    const webNodeModules = path.resolve(cwd, 'apps/web/node_modules');
    const existingNodePath = process.env.NODE_PATH || '';
    const nodePath = [rootNodeModules, apiNodeModules, webNodeModules, existingNodePath].filter(Boolean).join(path.delimiter);

    backendProcess = fork(apiPath, [], {
      env: {
        ...process.env,
        PORT: '4000',
        API_PORT: '4000',
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
    });

    console.log('[Instrumentation] NestJS API process spawned on internal port 4000.');
  } catch (err) {
    console.error('[Instrumentation] Failed to fork backend:', err);
  }
}
