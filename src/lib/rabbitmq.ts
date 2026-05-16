import amqp, { AmqpConnectionManager, ChannelWrapper } from 'amqp-connection-manager';

const url = process.env.RABBITMQ_URL || 'amqp://localhost';

// কানেকশন ম্যানেজার উইথ কানেকশন অপশনস
export const connection: AmqpConnectionManager = amqp.connect([url], {
  heartbeatIntervalInSeconds: 5, // কানেকশন চেক করার গ্যাপ কমিয়ে দিলাম
  reconnectTimeInSeconds: 5,
});

connection.on('connect', () => console.log('🚀 RabbitMQ Connected Successfully!'));
connection.on('connectFailed', (err) => console.log('❌ RabbitMQ Connect Failed', err.err.message));

export const channelWrapper: ChannelWrapper = connection.createChannel({
  json: true,
  setup: (channel: any) => {
    return channel.assertQueue('test-queue', { durable: true });
  },
});

export const isRabbitMQConnected = () => connection.isConnected();