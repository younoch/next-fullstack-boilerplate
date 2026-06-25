import { NextResponse } from 'next/server';
import { listTaxTasks } from '@/features/tax-calculator/server/taxRepository';

/**
 * @swagger
 * /api/tax/tasks:
 *   get:
 *     summary: Get paginated list of tax tasks
 *     description: Returns a paginated list of tax processing tasks
 *     parameters:
 *       - in: query
 *         name: page
 *         required: false
 *         description: Page number (default 1)
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         required: false
 *         description: Number of items per page (default 10)
 *         schema:
 *           type: integer
 *           example: 10
 *     responses:
 *       200:
 *         description: Successful response with paginated tax tasks
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 limit:
 *                   type: integer
 *                   example: 10
 *                 tasks:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/TaxTask'
 *       500:
 *         description: Internal server error
 */

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const page = Number(searchParams.get('page') || 1);
    const limit = Number(searchParams.get('limit') || 10);
    const skip = (page - 1) * limit;

    const tasks = await listTaxTasks(skip, limit);

    return NextResponse.json({
      success: true,
      page,
      limit,
      tasks,
    });

  } catch (error: any) {
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}