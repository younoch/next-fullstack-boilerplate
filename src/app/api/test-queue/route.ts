import { channelWrapper } from "@/lib/rabbitmq";
import { QUEUES } from "@/lib/queues";
import { NextResponse } from "next/server";

/**
 * @swagger
 * /api/test-queue:
 *   get:
 *     summary: Send a test queue message
 *     description: Publishes a sample message to RabbitMQ for connectivity verification.
 *     responses:
 *       200:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Sent via Modern Library!
 *       500:
 *         description: RabbitMQ error
 */
export async function GET() {
  try {
    const message = {
      task: "modern_task",
      email: "younus@fedora.com",
      timestamp: new Date()
    };

    await channelWrapper.sendToQueue(QUEUES.TEST.name, message);

    return NextResponse.json({ success: true, message: "Sent via Modern Library!" });
  } catch (error) {
    return NextResponse.json({ error: "RabbitMQ Error" }, { status: 500 });
  }
}
