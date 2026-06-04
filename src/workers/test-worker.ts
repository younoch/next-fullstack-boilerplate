// src/workers/test-worker.ts
import { processAndSaveTask } from '../services/taskService';
export const testWorkerHandler = async (content: any, socket: any) => {

  console.log("📥 [Test Worker] Processing:", content);
  
  // ১. ডাটাবেসে সেভ করা
  const savedTask = await processAndSaveTask(content);
  console.log(`✅ [Test Worker] Saved to DB: ${savedTask.id}`);

  // ২. সকেটে ফ্রন্টেন্ডকে পুশ করা
  socket.emit("task_status_update", {
    id: savedTask.id,
    taskName: savedTask.taskName || content.task,
    status: "completed"
  });
  console.log("🚀 [Test Worker] Socket event emitted!");
};

export default testWorkerHandler;