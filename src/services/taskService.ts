import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const processAndSaveTask = async (content: any) => {
  return await prisma.taskLog.create({
    data: {
      taskName: content.task || "unknown",
      email: content.email || "no-email",
    }
  });
};