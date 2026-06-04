import { channelWrapper } from "@/lib/rabbitmq";
import { QUEUES } from "@/lib/queues";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const message = {
      task: "modern_task",
      email: "younus@fedora.com",
      timestamp: new Date()
    };

    // সরাসরি মেসেজ পাঠানো
    await channelWrapper.sendToQueue(QUEUES.TEST.name, message);

    return NextResponse.json({ success: true, message: "Sent via Modern Library!" });
  } catch (error) {
    return NextResponse.json({ error: "RabbitMQ Error" }, { status: 500 });
  }
}
