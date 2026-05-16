export {};
const amqp = require('amqp-connection-manager');
const { io } = require("socket.io-client");

// 🛠️ বিভিন্ন স্পেসিফিক ওয়ার্কার হ্যান্ডলার ইমপোর্ট করা
const { testWorkerHandler } = require('./workers/test-worker');

const url = process.env.RABBITMQ_URL || 'amqp://localhost';
const dlqName = 'dead-letter-queue';

// 📡 সকেট কানেকশন (গ্লোবাল)
const socket = io("http://web:3000", {
  path: "/api/socket",
  transports: ["websocket"]
});

socket.on("connect", () => console.log("📡 [Global Worker] Connected to Socket.io Server"));

// 🐇 RabbitMQ কানেকশন (গ্লোবাল)
const connection = amqp.connect([url]);

const channelWrapper = connection.createChannel({
  setup: (channel: any) => {
    return Promise.all([
      // ----------------------------------------------------
      // ১ নম্বর কিউ: Test Queue
      // ----------------------------------------------------
      channel.assertQueue('test-queue', {
        durable: true,
        arguments: { 'x-dead-letter-exchange': '', 'x-dead-letter-routing-key': dlqName }
      }),
      channel.consume('test-queue', async (msg: any) => {
        if (msg !== null) {
          try {
            const content = JSON.parse(msg.content.toString());
            // 👉 নির্দিষ্ট হ্যান্ডলারকে কল করা হচ্ছে
            await testWorkerHandler(content, socket); 
            channel.ack(msg);
          } catch (error) {
            console.error("❌ Test Queue Failed:", error.message);
            channel.nack(msg, false, false);
          }
        }
      }),

      // ----------------------------------------------------
      // ২ নম্বর কিউ: (ভবিষ্যতে যেমন: email-queue, pdf-queue ইত্যাদি)
      // ----------------------------------------------------
      /*
      channel.assertQueue('email-queue', { durable: true }),
      channel.consume('email-queue', async (msg: any) => {
         // এখানে আরেকটি হ্যান্ডলার বসিয়ে দেবেন
      }),
      */

      // Dead Letter Queue
      channel.assertQueue(dlqName, { durable: true }),
      channel.prefetch(1),
    ]);
  },
});

channelWrapper.waitForConnect().then(() => {
  console.log("👷 Global Worker Manager is running and listening to all registered queues...");
});