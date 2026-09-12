import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import * as z from "zod";
import { getReferenceRange } from "@/lib/referenceRanges/lookup";
import { logAuditAction, AuditAction, AuditEntity } from "@/lib/audit/logger";

const resultItemSchema = z.object({
  id: z.string().min(1),
  value: z.string(), // everything comes as a string from the form, we parse internally if numeric
});

const resultSaveSchema = z.object({
  results: z.array(resultItemSchema)
});

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "LAB_TECHNICIAN")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = resultSaveSchema.parse(body);

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

    // We get age in days for the lookup utility
    let patientAgeInDays: number | undefined = undefined;
    if (order.patient.dateOfBirth) {
        const diffTime = Math.abs(new Date().getTime() - new Date(order.patient.dateOfBirth).getTime());
        patientAgeInDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } else if (order.patient.age) {
        patientAgeInDays = order.patient.age * 365;
    }

    const patientSex = order.patient.gender;

    // Use a transaction to save all results
    await prisma.$transaction(async (tx) => {
        for (const item of validatedData.results) {

            // Only update if there is a value
            // We fetch the existing result to get the parameter details safely
            const existingResult = await tx.labResult.findUnique({
                where: { id: item.id },
                include: { parameter: true }
            });

            if (!existingResult) continue;

            const isValueEmpty = item.value === null || item.value === undefined || item.value.trim() === "";

            let abnormalFlag = "NORMAL";
            let refMinValue: number | null = null;
            let refMaxValue: number | null = null;
            let refTextValue: string | null = null;

            // Only apply reference logic and flag calculation if there is a value
            if (!isValueEmpty) {
                const range = await getReferenceRange(existingResult.parameterId, patientAgeInDays, patientSex);

                if (range) {
                    refMinValue = range.minValue ? Number(range.minValue) : null;
                    refMaxValue = range.maxValue ? Number(range.maxValue) : null;
                    refTextValue = range.textValue;

                    if (existingResult.parameter.dataType === "NUMERIC") {
                        const numericValue = parseFloat(item.value);
                        if (!isNaN(numericValue)) {
                            if (refMinValue !== null && numericValue < refMinValue) {
                                abnormalFlag = "LOW";
                            } else if (refMaxValue !== null && numericValue > refMaxValue) {
                                abnormalFlag = "HIGH";
                            }
                        }
                    }
                }
            }

            await tx.labResult.update({
                where: { id: item.id },
                data: {
                    value: item.value,
                    abnormalFlag: isValueEmpty ? null : abnormalFlag,
                    refMinValue,
                    refMaxValue,
                    refTextValue,
                    unit: existingResult.parameter.unit,
                    status: isValueEmpty ? "PENDING" : "COMPLETED",
                    enteredBy: session.user.id,
                }
            });
        }

        // Check if all results for all items are completed
        const allResults = await tx.labResult.findMany({
            where: {
                orderItem: { orderId: order.id }
            }
        });

        const allCompleted = allResults.length > 0 && allResults.every(r => r.status === "COMPLETED");

        await tx.labOrder.update({
            where: { id: order.id },
            data: {
                status: allCompleted ? "COMPLETED" : "PARTIAL"
            }
        });

        // Also update Item status
        for (const orderItem of order.items) {
             const itemResults = allResults.filter(r => r.orderItemId === orderItem.id);
             const itemCompleted = itemResults.length > 0 && itemResults.every(r => r.status === "COMPLETED");
             await tx.labOrderItem.update({
                 where: { id: orderItem.id },
                 data: { status: itemCompleted ? "COMPLETED" : "PARTIAL" }
             })
        }
    });

    await logAuditAction(session.user.id, AuditAction.SUBMIT_RESULTS, AuditEntity.LAB_ORDER, params.id, `Results updated for order ${order.orderNumber}`);

    return NextResponse.json({ message: "Results saved successfully" });
  } catch (error: any) {
    console.error("Save Results Error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Validation error", errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
