import { prisma } from "@/lib/prisma";
import type { TaskMessage } from "@/types/queue";
import type { TaskLog } from "@prisma/client";

export const processAndSaveTask = async (
  content: TaskMessage
): Promise<TaskLog> => {
  return prisma.taskLog.create({
    data: {
      taskName: content.task || "unknown",
      email: content.email || "no-email",
    },
  });
};
