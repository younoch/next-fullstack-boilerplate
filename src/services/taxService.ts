export {};
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { io } = require("socket.io-client");

// ডকার নেটওয়ার্কে web সার্ভিসের সাথে কানেক্ট করছি
const socket = io("http://web:3000"); 

socket.on("connect", () => {
  console.log("📡 Worker connected to Socket.io Server");
});

const processAndSaveTask = async (content: any) => {
  const savedTask = await prisma.taskLog.create({
    data: {
      taskName: content.task || "unknown",
      email: content.email || "no-email",
      status: "processed"
    }
  });

  // ✅ ফ্রন্টেন্ডকে রিয়েল-টাইম নোটিফিকেশন পাঠানো
  socket.emit("task_status_update", {
    id: savedTask.id,
    taskName: savedTask.taskName,
    status: "completed"
  });

  return savedTask;
};

module.exports = { processAndSaveTask };