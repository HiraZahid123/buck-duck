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
    backendProcess = fork(apiPath, [], {
      env: {
        ...process.env,
        PORT: '4000',
        API_PORT: '4000',
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
