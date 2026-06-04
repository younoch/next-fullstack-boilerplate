// src/app/api/tax/calculate/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // আপনার প্রজেক্টের প্রিজমা ক্লায়েন্ট পাথ
import { channelWrapper } from '@/lib/rabbitmq';
import { QUEUES } from '@/lib/queues';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { payload } = body; // 👈 socketRoomId সম্পূর্ণ বাদ, শুধু মূল পেলোড নিচ্ছি

    if (!payload) {
      return NextResponse.json({ success: false, message: 'Payload is required' }, { status: 400 });
    }

    // ১. ডাটাবেজে টাস্ক তৈরি করা (ডিফল্ট স্ট্যাটাস PENDING থাকবে)
    const task = await prisma.taxTask.create({
      data: {
        status: 'PENDING',
        payload: payload, 
      },
    });

    // ২. র‍্যাবিটএমকিউ কিউতে মেসেজ পাঠানো
    await channelWrapper.sendToQueue(QUEUES.TAX.name, {
      taskId: task.id,
      payload: payload, // ওয়ার্কার শুধু taskId আর payload দিয়ে কাজ করবে
    });

    // ৩. ফ্রন্টএন্ডে taskId রিটার্ন করা, যা দিয়ে ফ্রন্টএন্ড পোলিং শুরু করবে
    return NextResponse.json({
      success: true,
      message: 'Tax calculation task queued successfully',
      taskId: task.id, // এই আইডি দিয়েই ফ্রন্টএন্ড /api/tax/status/[taskId] এ হিট করবে
    });

  } catch (error: any) {
    console.error('❌ Tax Calculate API Error:', error.message);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}