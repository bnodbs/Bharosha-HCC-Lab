import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import { resolveReferenceRange, evaluateNumericResult, formatRangeDisplay } from "@/lib/results/referenceLogic";
import * as z from "zod";

const resultSubmissionSchema = z.object({
  status: z.enum(["PARTIAL", "COMPLETED"]),
  results: z.array(z.object({
    orderItemId: z.string(),
    parameterId: z.string(),
    value: z.string()
  }))
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "LAB_TECHNICIAN")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = resultSubmissionSchema.parse(body);

    // Fetch order to verify existence and get patient context for ranges
    const order = await prisma.labOrder.findUnique({
      where: { id: params.id },
      include: {
        patient: true,
        items: true
      }
    });

    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    // Verify all submitted items belong to this order and that parameters actually belong to the tests ordered
    const validOrderItemIds = order.items.map(i => i.id);
    const invalidItems = validatedData.results.filter(r => !validOrderItemIds.includes(r.orderItemId));
    if (invalidItems.length > 0) {
        return NextResponse.json({ message: "Invalid order items submitted" }, { status: 400 });
    }

    // Map ordered test items to their valid parameter IDs to prevent cross-test parameter injection
    const orderItemTestMap = order.items.reduce((acc, item) => {
      acc[item.id] = item.testId;
      return acc;
    }, {} as Record<string, string>);

    // Process results within a transaction to maintain integrity
    await prisma.$transaction(async (tx) => {
      // 1. Process each result
      for (const result of validatedData.results) {

        // Fetch parameter details including ranges
        const parameter = await tx.testParameter.findUnique({
            where: { id: result.parameterId },
            include: { referenceRanges: { where: { isActive: true } } }
        });

        if (!parameter) continue;

        // Security Check: Verify this parameter actually belongs to the test ordered in this item
        const expectedTestId = orderItemTestMap[result.orderItemId];
        if (parameter.testId !== expectedTestId) {
            throw new Error(`Parameter ${parameter.name} does not belong to the ordered test.`);
        }

        let numericValue = null;
        let flag = "NORMAL";
        let rangeSnapshot = null;

        if (parameter.dataType === 'NUMERIC') {
            const parsedNum = parseFloat(result.value);
            if (!isNaN(parsedNum)) {
                numericValue = parsedNum;

                const applicableRange = resolveReferenceRange(
                    parameter.referenceRanges,
                    order.patient.age,
                    order.patient.gender
                );

                flag = evaluateNumericResult(numericValue, applicableRange);
                rangeSnapshot = formatRangeDisplay(applicableRange);
            }
        }

        // Upsert result
        await tx.labResult.upsert({
            where: {
                orderItemId_parameterId: {
                    orderItemId: result.orderItemId,
                    parameterId: result.parameterId
                }
            },
            update: {
                value: result.value,
                numericValue,
                referenceRange: rangeSnapshot,
                unit: parameter.unit,
                flag: flag as any,
                enteredBy: session.user.id
            },
            create: {
                orderItemId: result.orderItemId,
                parameterId: result.parameterId,
                value: result.value,
                numericValue,
                referenceRange: rangeSnapshot,
                unit: parameter.unit,
                flag: flag as any,
                enteredBy: session.user.id
            }
        });
      }

      // 2. Update Order Status
      await tx.labOrder.update({
          where: { id: params.id },
          data: { status: validatedData.status }
      });

      // 3. Update Order Items Status
      await tx.labOrderItem.updateMany({
          where: { orderId: params.id },
          data: { status: validatedData.status }
      });
    });

    await prisma.auditLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE_RESULTS",
        entityType: "LabOrder",
        entityId: params.id,
        details: `Updated results for order ${order.orderNumber}. Status set to ${validatedData.status}.`
      }
    });

    return NextResponse.json({ message: "Results saved successfully" });
  } catch (error: any) {
    console.error("Save Results Error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Validation error", errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
