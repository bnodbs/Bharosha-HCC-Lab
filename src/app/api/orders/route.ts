import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import { generateOrderId } from "@/lib/orders/generateOrderId";
import * as z from "zod";

const orderSchema = z.object({
  patientId: z.string().min(1, "Patient ID is required"),
  referredBy: z.string().optional(),
  notes: z.string().optional(),
  testIds: z.array(z.string()).min(1, "At least one test must be selected"),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "LAB_TECHNICIAN")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = orderSchema.parse(body);

    // Verify patient exists
    const patient = await prisma.patient.findUnique({
      where: { id: validatedData.patientId }
    });

    if (!patient) {
      return NextResponse.json({ message: "Patient not found" }, { status: 404 });
    }

    // Verify tests exist and are active
    const tests = await prisma.test.findMany({
      where: {
        id: { in: validatedData.testIds },
        isActive: true
      }
    });

    if (tests.length !== validatedData.testIds.length) {
      return NextResponse.json({ message: "One or more tests are invalid or inactive" }, { status: 400 });
    }

    // Use transaction to create order and items
    const order = await prisma.$transaction(async (tx) => {
      const orderNumber = await generateOrderId();

      return tx.labOrder.create({
        data: {
          orderNumber,
          patientId: validatedData.patientId,
          referredBy: validatedData.referredBy,
          notes: validatedData.notes,
          status: "PENDING",
          items: {
            create: validatedData.testIds.map(testId => ({
              testId,
              status: "PENDING"
            }))
          }
        },
        include: {
          items: true
        }
      });
    });

    // Log the action
    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "CREATE_ORDER",
        entityType: "LabOrder",
        entityId: order.id,
        details: `Order ${order.orderNumber} created for patient ${patient.patientId}`
      }
    });

    return NextResponse.json({ order }, { status: 201 });
  } catch (error: any) {
    console.error("Create Order Error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Validation error", errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
