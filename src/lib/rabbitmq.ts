// src/lib/rabbitmq.ts
import amqp, { AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';
import { assertAllQueues } from './queues';
import { logger } from './logger';

const url = process.env.RABBITMQ_URL || 'amqp://localhost';

export const connection: AmqpConnectionManager = amqp.connect([url], {
  heartbeatIntervalInSeconds: 10,
  reconnectTimeInSeconds: 10,
});

connection.on('connect', () => logger.info('🚀 RabbitMQ Connected Successfully!'));
connection.on('connectFailed', (err) => logger.error({ err: err?.err?.message }, '❌ RabbitMQ Connect Failed'));

export const channelWrapper: ChannelWrapper = connection.createChannel({
  json: true,
  setup: async (channel: any) => {
    await assertAllQueues(channel);
    logger.info('📦 All Queues Asserted Successfully!');
  },
});

export const isRabbitMQConnected = () => connection.isConnected();
