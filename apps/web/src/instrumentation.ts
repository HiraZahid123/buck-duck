export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Avoid running during static generation / next build
    if (process.env.NEXT_PHASE === 'phase-production-build') {
      return;
    }

    try {
      const { ensureBackendRunning } = await import('./lib/start-backend');
      await ensureBackendRunning();
    } catch (err) {
      console.error('[Instrumentation] Error initializing backend:', err);
    }
  }
}
