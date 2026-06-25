import { NextResponse } from "next/server";
import { swaggerSpec } from '@/lib/swagger';

export async function GET(request: Request) {
  return NextResponse.json(swaggerSpec);
}
