// src/workers/test-worker.ts
import { processAndSaveTask } from '@/features/tax-calculator/server/taskRepository';
import { redis } from '@/lib/redis';
import { logger } from '@/lib/logger';

export const testWorkerHandler = async (content: any, socket: any) => {
  const idKey = content.id || content.email || content.task || JSON.stringify(content);
  const key = `test-worker:${idKey}`;

  if (await redis.get(key)) {
    logger.info({ key }, 'Duplicate test-worker message, skipping');
    return;
  }

  logger.info({ content }, '📥 [Test Worker] Processing');

  // ১. ডাটাবেসে সেভ করা
  const savedTask = await processAndSaveTask(content);
  logger.info({ taskId: savedTask.id }, '✅ [Test Worker] Saved to DB');

  // ২. সকেটে ফ্রন্টেন্ডকে পুশ করা
  socket.emit('task_status_update', {
    id: savedTask.id,
    taskName: savedTask.taskName || content.task,
    status: 'completed',
  });
  logger.info({ taskId: savedTask.id }, '🚀 [Test Worker] Socket event emitted');

  await redis.set(key, '1', 'EX', 60 * 60 * 24);
};

export default testWorkerHandler;