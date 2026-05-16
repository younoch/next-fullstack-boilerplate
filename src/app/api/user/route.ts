import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const newUser = await prisma.user.create({
      data: {
        email: `test-${Math.random()}@example.com`,
        name: "Younus",
      },
    });
    return NextResponse.json(newUser);
  } catch (error) {
    return NextResponse.json({ error: "Database failed" }, { status: 500 });
  }
}