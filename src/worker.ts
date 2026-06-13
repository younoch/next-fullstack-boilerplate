// src/worker.ts
import amqp from 'amqp-connection-manager';
import { io } from 'socket.io-client';
import { assertAllQueues, QUEUES } from './lib/queues';
import { testWorkerHandler } from './workers/test-worker';
import { taxWorkerHandler } from './workers/tax-worker';
import { logger } from './lib/logger';

const url = process.env.RABBITMQ_URL || 'amqp://localhost';

const WEBSOCKET_URL = process.env.WEBSOCKET_URL || 'http://websocket:3000';
const socket = io(WEBSOCKET_URL, {
  transports: ['websocket'],
});

socket.on('connect', () => logger.info('📡 [Global Worker] Connected to Socket.io Server'));

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
        logger.error({ err: message }, '❌ Test Queue Failed');
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
        logger.error({ err: message }, '❌ Tax Queue Failed');
        channel.nack(msg, false, false);
      }
    });
  },
});

channelWrapper.waitForConnect().then(() => {
  logger.info('👷 Global Worker Manager is running and listening to all registered queues...');
});
