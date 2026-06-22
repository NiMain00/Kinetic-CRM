import 'dotenv/config';

const INTERVAL_MS = 60_000;

async function runTasks() {
  console.log(`[Scheduler] Running tasks at ${new Date().toISOString()}`);
}

async function main() {
  console.log('[Scheduler] Started');
  await runTasks();
  setInterval(runTasks, INTERVAL_MS);
}

main().catch((err) => {
  console.error('[Scheduler] Fatal error:', err);
  process.exit(1);
});
