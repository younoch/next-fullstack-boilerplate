// src/lib/queues.ts
import type { Channel } from 'amqplib';
export type QueueDefinition = {
  name: string;
  dlq: string;
};

/** Add new queues here — both web (publisher) and worker (consumer) use this registry. */
export const QUEUES = {
  TEST: { name: 'test-queue', dlq: 'dead-letter-queue'},
  TAX: {  name: 'tax-calculation-queue',  dlq: 'tax-dead-letter-queue'},
} as const satisfies Record<string, QueueDefinition>;

export type QueueKey = keyof typeof QUEUES;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function assertAllQueues(channel: Channel): Promise<void> {
  for (const { name, dlq } of Object.values(QUEUES)) {
    await channel.assertQueue(dlq, { durable: true });
    await channel.assertQueue(name, {
      durable: true,
      arguments: {
        'x-dead-letter-exchange': '',
        'x-dead-letter-routing-key': dlq,
      },
    });
  }
}
