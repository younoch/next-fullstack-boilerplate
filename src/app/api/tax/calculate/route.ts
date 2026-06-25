// src/app/api/tax/calculate/route.ts
import { NextResponse } from 'next/server';
import { channelWrapper } from '@/lib/rabbitmq';
import { QUEUES } from '@/lib/queues';
import { createTaxTask } from '@/features/tax-calculator/server/taxRepository';

/**
 * @swagger
 * /api/tax/calculate:
 *   post:
 *     summary: Queue a new tax calculation task
 *     description: Create a tax processing task and enqueue it for background execution.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               payload:
 *                 type: object
 *                 properties:
 *                   grossIncome:
 *                     type: number
 *                     example: 100000
 *                   totalDeductions:
 *                     type: number
 *                     example: 5000
 *                   countryId:
 *                     type: string
 *                     example: BD
 *                   fiscalYear:
 *                     type: string
 *                     example: 2026-27
 *                 required:
 *                   - grossIncome
 *                   - countryId
 *                   - fiscalYear
 *     responses:
 *       200:
 *         description: Task queued successfully
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
 *                   example: Tax calculation task queued successfully
 *                 taskId:
 *                   type: string
 *                   example: task_12345
 *       400:
 *         description: Invalid request payload
 *       500:
 *         description: Internal server error
 */
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