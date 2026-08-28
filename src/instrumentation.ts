/**
 * Next runs this once per server start, which is the only hook that fires before
 * the app serves anything.
 */
export async function register() {
  // The edge runtime has no filesystem and no sqlite; this is Node-only work.
  if (process.env.NEXT_RUNTIME !== 'nodejs') return

  const { recoverStrandedJobs } = await import('./lib/jobs')
  recoverStrandedJobs()
}
