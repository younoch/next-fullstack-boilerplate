// src/lib/rabbitmq.ts
import amqp, { AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';
import { assertAllQueues } from './queues';

const url = process.env.RABBITMQ_URL || 'amqp://localhost';

export const connection: AmqpConnectionManager = amqp.connect([url], {
  heartbeatIntervalInSeconds: 5,
  reconnectTimeInSeconds: 5,
});

connection.on('connect', () => console.log('🚀 RabbitMQ Connected Successfully!'));
connection.on('connectFailed', (err) => console.log('❌ RabbitMQ Connect Failed', err.err.message));

export const channelWrapper: ChannelWrapper = connection.createChannel({
  json: true,
  setup: async (channel: any) => {
    await assertAllQueues(channel);
    console.log('📦 All Queues Asserted Successfully!');
  },
});

export const isRabbitMQConnected = () => connection.isConnected();
