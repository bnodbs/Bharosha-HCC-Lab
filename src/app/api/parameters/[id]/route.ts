import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import * as z from "zod";

const parameterUpdateSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1).optional(),
  shortName: z.string().optional(),
  unit: z.string().optional(),
  dataType: z.enum(["NUMERIC", "TEXT", "SELECT", "POSITIVE_NEGATIVE", "BOOLEAN"]).optional(),
  orderIndex: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = parameterUpdateSchema.parse(body);

    const parameter = await prisma.testParameter.update({
      where: { id: params.id },
      data: validatedData,
    });

    return NextResponse.json({ parameter });
  } catch (error: any) {
    console.error("Parameter Update Error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Validation error", errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const parameter = await prisma.testParameter.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    return NextResponse.json({ parameter });
  } catch (error: any) {
    console.error("Parameter Deactivation Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
