import prisma from '@/lib/prisma';

export const processAndSaveTask = async (content: any) => {
  return await prisma.taskLog.create({
    data: {
      taskName: content.task || 'unknown',
      email: content.email || 'no-email',
    },
  });
};

export default processAndSaveTask;
