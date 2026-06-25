// src/app/api/tax/status/[taskId]/route.ts
import { NextResponse } from 'next/server';
import { getTaxTask } from '@/features/tax-calculator/server/taxRepository';

/**
 * @swagger
 * /api/tax/status/{taskId}:
 *   get:
 *     summary: Get current tax task status
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Current task status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 status:
 *                   type: string
 *                   example: PENDING
 *                 result:
 *                   type: object
 *                   nullable: true
 *                   properties:
 *                     taxableIncome:
 *                       type: number
 *                       example: 85000
 *                     taxDue:
 *                       type: number
 *                       example: 15000
 *                     metaData:
 *                       type: object
 *                       properties:
 *                         calculatedBy:
 *                           type: string
 *                           example: system
 *                 error:
 *                   type: string
 *                   nullable: true
 *       404:
 *         description: Task not found
 *       500:
 *         description: Internal server error
 */
export async function GET(
  { params }: { params: { taskId: string } }
) {
  try {
    const { taskId } = params;

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