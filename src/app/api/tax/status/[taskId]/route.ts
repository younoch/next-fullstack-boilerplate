// src/app/api/tax/status/[taskId]/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // আপনার প্রজেক্টের প্রিজমা ক্লায়েন্ট পাথ দিন

export async function GET(
  request: Request,
  { params }: { params: Promise<{ taskId: string }> }
) {
  try {
    const { taskId } = await params;

    // 🚀 Production Optimization: শুধুমাত্র প্রয়োজনীয় ফিল্ড সিলেক্ট করা হচ্ছে (RAM & DB bandwidth সাশ্রয়)
    const task = await prisma.taxTask.findUnique({
      where: { id: taskId },
      select: {
        status: true,
        result: true,
        errorMessage: true,
      },
    });

    if (!task) {
      return NextResponse.json({ success: false, message: 'Task not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      status: task.status, // PENDING, COMPLETED, FAILED
      result: task.result,
      error: task.errorMessage
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}