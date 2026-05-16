export {};
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const processAndSaveTask = async (content: any) => {
  return await prisma.taskLog.create({
    data: {
      taskName: content.task || "unknown",
      email: content.email || "no-email",
    }
  });
};

// এটিকে এক্সপোর্ট করে দিন
module.exports = { processAndSaveTask };