import {NextResponse} from "next/server";
import {getTaxCalculation} from "@/features/tax-calculator/server/taxRepository";

export async function GET(
  request: Request,
  { params }: { params: { calculationId: string } }
) {
  try {
    const { calculationId } = await params;

    // Fetch calculation via feature service helper
    const calculation = await getTaxCalculation(calculationId);

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