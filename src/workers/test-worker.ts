import type { Socket } from "socket.io-client";
import { processAndSaveTask } from "@/services/taskService";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  TaskMessage,
} from "@/types/queue";

type WorkerSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export const testWorkerHandler = async (
  content: TaskMessage,
  socket: WorkerSocket
): Promise<void> => {
  console.log("📥 [Test Worker] Processing:", content);

  // ১. ডাটাবেসে সেভ করা
  const savedTask = await processAndSaveTask(content);
  console.log(`✅ [Test Worker] Saved to DB: ${savedTask.id}`);

  // ২. সকেটে ফ্রন্টেন্ডকে পুশ করা
  socket.emit("task_status_update", {
    id: savedTask.id,
    taskName: savedTask.taskName || content.task,
    status: "completed",
  });
  console.log("🚀 [Test Worker] Socket event emitted!");
};
