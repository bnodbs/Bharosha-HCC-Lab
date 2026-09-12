import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import * as z from "zod";
import { logAuditAction, AuditAction, AuditEntity } from "@/lib/audit/logger";

const parameterSchema = z.object({
  code: z.string().optional(),
  name: z.string().min(1),
  shortName: z.string().optional(),
  unit: z.string().optional(),
  dataType: z.enum(["NUMERIC", "TEXT", "SELECT", "POSITIVE_NEGATIVE", "BOOLEAN"]),
  orderIndex: z.number().int().default(0),
});

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const testExists = await prisma.test.findUnique({ where: { id: params.id }});
    if (!testExists) {
        return NextResponse.json({ message: "Test not found" }, { status: 404 });
    }

    const body = await request.json();
    const validatedData = parameterSchema.parse(body);

    const parameter = await prisma.testParameter.create({
      data: {
        ...validatedData,
        testId: params.id
      },
    });

    await logAuditAction(session.user.id, AuditAction.CREATE, AuditEntity.TEST_PARAMETER, parameter.id, `Created parameter: ${parameter.name}`);

    return NextResponse.json({ parameter }, { status: 201 });
  } catch (error: any) {
    console.error("Parameter Creation Error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Validation error", errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
