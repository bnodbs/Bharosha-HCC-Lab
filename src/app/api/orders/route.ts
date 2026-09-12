import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import { generateOrderId } from "@/lib/orders/generateOrderId";
import * as z from "zod";
import { logAuditAction, AuditAction, AuditEntity } from "@/lib/audit/logger";

const orderSchema = z.object({
  patientId: z.string().min(1),
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

    const orderNumber = await generateOrderId();

    const order = await prisma.$transaction(async (tx) => {
        const newOrder = await tx.labOrder.create({
            data: {
                orderNumber,
                patientId: validatedData.patientId,
                referredBy: validatedData.referredBy,
                notes: validatedData.notes,
                createdBy: session.user.id,
                status: "PENDING",
            }
        });

        const activeTests = await tx.test.findMany({
            where: {
                id: { in: validatedData.testIds },
                isActive: true
            },
            include: {
                parameters: {
                    where: { isActive: true }
                }
            }
        });

        for (const test of activeTests) {
            const orderItem = await tx.labOrderItem.create({
                data: {
                    orderId: newOrder.id,
                    testId: test.id,
                    status: "PENDING"
                }
            });

            // Pre-create blank results for every parameter associated with this test
            if (test.parameters.length > 0) {
                const resultData = test.parameters.map(param => ({
                    orderItemId: orderItem.id,
                    parameterId: param.id,
                    value: "",
                    status: "PENDING"
                }));

                await tx.labResult.createMany({
                    data: resultData
                });
            }
        }

        return newOrder;
    });

    await logAuditAction(session.user.id, AuditAction.CREATE, AuditEntity.LAB_ORDER, order.id, `Order created: ${order.orderNumber} for patient ${validatedData.patientId}`);

    return NextResponse.json({ order }, { status: 201 });
  } catch (error: any) {
    console.error("Order Creation Error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Validation error", errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
