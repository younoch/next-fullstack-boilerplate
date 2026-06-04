// src/worker.ts
import amqp from 'amqp-connection-manager';
import { io } from 'socket.io-client';
import { assertAllQueues, QUEUES } from './lib/queues';
import { testWorkerHandler } from './workers/test-worker';
import { taxWorkerHandler } from './workers/tax-worker';

const url = process.env.RABBITMQ_URL || 'amqp://localhost';

const socket = io('http://web:3000', {
  path: '/api/socket',
  transports: ['websocket'],
});

socket.on('connect', () => console.log('📡 [Global Worker] Connected to Socket.io Server'));

const connection = amqp.connect([url]);

const channelWrapper = connection.createChannel({
  setup: async (channel: any) => {
    await assertAllQueues(channel);
    await channel.prefetch(1);

    await channel.consume(QUEUES.TEST.name, async (msg: any) => {
      if (msg === null) return;
      try {
        const content = JSON.parse(msg.content.toString());
        await testWorkerHandler(content, socket);
        channel.ack(msg);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('❌ Test Queue Failed:', message);
        channel.nack(msg, false, false);
      }
    });

    await channel.consume(QUEUES.TAX.name, async (msg: any) => {
      if (msg === null) return;
      try {
        const content = JSON.parse(msg.content.toString());
        await taxWorkerHandler(content);
        channel.ack(msg);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error('❌ Tax Queue Failed:', message);
        channel.nack(msg, false, false);
      }
    });
  },
});

channelWrapper.waitForConnect().then(() => {
  console.log('👷 Global Worker Manager is running and listening to all registered queues...');
});
