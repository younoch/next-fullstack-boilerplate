import {NextResponse} from "next/server";
import {getTaxCalculation} from "@/features/tax-calculator/server/taxRepository";

/**
 * @swagger
 * /api/tax/breakdown/{taskId}:
 *   get:
 *     summary: Get tax calculation breakdown
 *     description: Returns the stored calculation details for a completed tax task.
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tax calculation breakdown returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 calculation:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                       example: calc_12345
 *                     country:
 *                       type: object
 *                       properties:
 *                         code:
 *                           type: string
 *                           example: BD
 *                         name:
 *                           type: string
 *                           example: Bangladesh
 *                     fiscalYear:
 *                       type: integer
 *                       example: 2026
 *                     grossIncome:
 *                       type: number
 *                       example: 150000
 *                     totalDeductions:
 *                       type: number
 *                       example: 20000
 *                     taxableIncome:
 *                       type: number
 *                       example: 130000
 *                     taxDue:
 *                       type: number
 *                       example: 20500
 *                     metaData:
 *                       type: object
 *                       nullable: true
 *       404:
 *         description: Calculation not found
 *       500:
 *         description: Internal server error
 */
export async function GET(
  request: Request,
  { params }: { params: { taskId: string } }
) {
  try {
    const { taskId } = params;

    // Fetch calculation via feature service helper
    const calculation = await getTaxCalculation(taskId);

    if (!calculation) {
      return NextResponse.json({ success: false, message: 'Calculation not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      calculation,
    });

  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}