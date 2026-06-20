// src/app/api/tax/calculate/route.ts
import { NextResponse } from 'next/server';
import { channelWrapper } from '@/lib/rabbitmq';
import { QUEUES } from '@/lib/queues';
import { createTaxTask } from '@/features/tax-calculator/server/taxRepository';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { payload } = body; 

    if (!payload) {
      return NextResponse.json({ success: false, message: 'Payload is required' }, { status: 400 });
    }
    const task = await createTaxTask(payload);

    await channelWrapper.sendToQueue(QUEUES.TAX.name, {
      taskId: task.id,
      payload: payload, 
    });

    return NextResponse.json({
      success: true,
      message: 'Tax calculation task queued successfully',
      taskId: task.id, 
    });

  } catch (error: any) {
    console.error('❌ Tax Calculate API Error:', error.message);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}