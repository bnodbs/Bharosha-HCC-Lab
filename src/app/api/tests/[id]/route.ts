import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import * as z from "zod";
import { logAuditAction, AuditAction, AuditEntity } from "@/lib/audit/logger";

const testUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  category: z.string().min(1).optional(),
  displayOrder: z.number().int().optional(),
  price: z.number().optional(),
  isActive: z.boolean().optional(),
});

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const test = await prisma.test.findUnique({
      where: { id: params.id },
      include: {
        parameters: {
          orderBy: { orderIndex: 'asc' }
        }
      }
    });

    if (!test) {
       return NextResponse.json({ message: "Test not found" }, { status: 404 });
    }

    return NextResponse.json(test);
  } catch (error) {
    console.error("Fetch Test Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = testUpdateSchema.parse(body);

    const test = await prisma.test.update({
      where: { id: params.id },
      data: validatedData,
    });

    await logAuditAction(session.user.id, AuditAction.UPDATE, AuditEntity.TEST_MASTER, test.id, `Updated test: ${test.code}`);

    return NextResponse.json({ test });
  } catch (error: any) {
    console.error("Test Update Error:", error);
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

    const test = await prisma.test.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    await logAuditAction(session.user.id, AuditAction.DELETE, AuditEntity.TEST_MASTER, test.id, `Deactivated test: ${test.code}`);

    return NextResponse.json({ test });
  } catch (error: any) {
    console.error("Test Deactivation Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
