import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import * as z from "zod";
import { logAuditAction, AuditAction, AuditEntity } from "@/lib/audit/logger";

const rangeUpdateSchema = z.object({
  gender: z.enum(["MALE", "FEMALE", "ALL"]).optional(),
  minAge: z.number().int().nonnegative().nullable().optional(),
  maxAge: z.number().int().nonnegative().nullable().optional(),
  ageUnit: z.enum(["DAYS", "MONTHS", "YEARS"]).optional(),
  minValue: z.number().nullable().optional(),
  maxValue: z.number().nullable().optional(),
  textValue: z.string().nullable().optional(),
  isCritical: z.boolean().optional(),
  isActive: z.boolean().optional(),
}).refine((data) => {
    if (data.minAge !== null && data.minAge !== undefined &&
        data.maxAge !== null && data.maxAge !== undefined) {
        return data.minAge <= data.maxAge;
    }
    return true;
}, { message: "minAge cannot be greater than maxAge", path: ["maxAge"] })
  .refine((data) => {
    if (data.minValue !== null && data.minValue !== undefined &&
        data.maxValue !== null && data.maxValue !== undefined) {
        return data.minValue <= data.maxValue;
    }
    return true;
}, { message: "minValue cannot be greater than maxValue", path: ["maxValue"] });

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();

    const payload = {
        ...body,
        minAge: body.minAge === "" ? null : body.minAge,
        maxAge: body.maxAge === "" ? null : body.maxAge,
        minValue: body.minValue === "" ? null : body.minValue,
        maxValue: body.maxValue === "" ? null : body.maxValue,
        textValue: body.textValue === "" ? null : body.textValue,
    };

    const validatedData = rangeUpdateSchema.parse(payload);

    const range = await prisma.referenceRange.update({
      where: { id: params.id },
      data: validatedData,
    });

    await logAuditAction(session.user.id, AuditAction.UPDATE, AuditEntity.REFERENCE_RANGE, range.id, `Updated reference range ${range.id}`);

    return NextResponse.json({ range });
  } catch (error: any) {
    console.error("Reference Range Update Error:", error);
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

    const range = await prisma.referenceRange.update({
      where: { id: params.id },
      data: { isActive: false },
    });

    await logAuditAction(session.user.id, AuditAction.DELETE, AuditEntity.REFERENCE_RANGE, range.id, `Deactivated reference range ${range.id}`);

    return NextResponse.json({ range });
  } catch (error: any) {
    console.error("Reference Range Deactivation Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
