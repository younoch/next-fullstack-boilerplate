// src/app/api/tax/status/[taskId]/route.ts
import { NextResponse } from 'next/server';
import { getTaxTask } from '@/features/tax-calculator/server/taxRepository';

export async function GET(
  { params }: { params: { taskId: string } }
) {
  try {
    const { taskId } = await params;

    // Fetch task via feature service helper
    const task = await getTaxTask(taskId);

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