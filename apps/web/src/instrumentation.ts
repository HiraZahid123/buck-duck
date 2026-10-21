/**
 * Next.js Instrumentation Hook
 * The NestJS backend is managed as a standalone background process by server.js.
 * We deliberately do NOT spawn background child processes from instrumentation
 * because Next.js executes this hook in multiple worker threads/processes.
 */
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Backend process management is handled exclusively by server.js
  }
}
