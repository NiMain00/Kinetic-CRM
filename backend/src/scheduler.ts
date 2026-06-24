import 'dotenv/config';
import { prisma } from './config/database';

const FIVE_MINUTES = 5 * 60 * 1000;
const ONE_DAY = 24 * 60 * 60 * 1000;

async function checkSlaDeadlines() {
  const now = new Date();
  const overdueApprovals = await prisma.approval.findMany({
    where: {
      status: 'pending',
      slaDeadline: { lt: now },
    },
    select: { id: true, resourceType: true, resourceId: true, slaDeadline: true },
    take: 50,
  });

  for (const approval of overdueApprovals) {
    console.log(`[Scheduler] SLA overdue for approval ${approval.id} (${approval.resourceType}#${approval.resourceId})`);
  }
}

async function dispatchNotifications() {
  const pending = await prisma.notification.findMany({
    where: { readAt: null },
    take: 50,
  });
  if (pending.length > 0) {
    console.log(`[Scheduler] ${pending.length} unread notifications pending`);
  }
}

async function cleanupExpiredSessions() {
  const result = await prisma.activeSession.deleteMany({
    where: {
      expiresAt: { lt: new Date() },
    },
  });
  if (result.count > 0) {
    console.log(`[Scheduler] Cleaned up ${result.count} expired sessions`);
  }
}

async function runTasks() {
  console.log(`[Scheduler] Running tasks at ${new Date().toISOString()}`);
  try {
    await checkSlaDeadlines();
  } catch (err) {
    console.error('[Scheduler] SLA check error:', err);
  }
  try {
    await dispatchNotifications();
  } catch (err) {
    console.error('[Scheduler] Notification dispatch error:', err);
  }
}

async function runDailyTasks() {
  console.log(`[Scheduler] Running daily tasks at ${new Date().toISOString()}`);
  try {
    await cleanupExpiredSessions();
  } catch (err) {
    console.error('[Scheduler] Daily cleanup error:', err);
  }
}

async function main() {
  console.log('[Scheduler] Started');
  await runTasks();
  setInterval(runTasks, FIVE_MINUTES);
  setInterval(runDailyTasks, ONE_DAY);
  const msToMidnight = new Date().setHours(24, 0, 0, 0) - Date.now();
  setTimeout(runDailyTasks, msToMidnight < 0 ? ONE_DAY : msToMidnight);
}

main().catch((err) => {
  console.error('[Scheduler] Fatal error:', err);
  process.exit(1);
});
