import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import * as z from "zod";

const rangeSchema = z.object({
  gender: z.enum(["ALL", "MALE", "FEMALE"]),
  minAge: z.number().int().min(0).nullable().optional(),
  maxAge: z.number().int().min(0).nullable().optional(),
  ageUnit: z.enum(["DAYS", "MONTHS", "YEARS"]),
  lowerLimit: z.number().nullable().optional(),
  upperLimit: z.number().nullable().optional(),
  unit: z.string().optional(),
  textValue: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
}).refine(data => {
  if (data.minAge != null && data.maxAge != null) {
    return data.minAge <= data.maxAge;
  }
  return true;
}, {
  message: "Min Age cannot be greater than Max Age",
  path: ["minAge"],
}).refine(data => {
  if (data.lowerLimit != null && data.upperLimit != null) {
    return data.lowerLimit <= data.upperLimit;
  }
  return true;
}, {
  message: "Lower Limit cannot be greater than Upper Limit",
  path: ["lowerLimit"],
});

export async function PUT(
  request: Request,
  { params }: { params: { id: string, rangeId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = rangeSchema.parse(body);

    const range = await prisma.referenceRange.update({
      where: { id: params.rangeId, parameterId: params.id },
      data: {
        gender: validatedData.gender,
        minAge: validatedData.minAge,
        maxAge: validatedData.maxAge,
        ageUnit: validatedData.ageUnit,
        lowerLimit: validatedData.lowerLimit,
        upperLimit: validatedData.upperLimit,
        unit: validatedData.unit,
        textValue: validatedData.textValue,
        description: validatedData.description,
        isActive: validatedData.isActive,
      },
    });

    return NextResponse.json({ range });
  } catch (error: any) {
    console.error("Update Reference Range Error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Validation error", errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string, rangeId: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    await prisma.referenceRange.delete({
      where: { id: params.rangeId, parameterId: params.id },
    });

    return NextResponse.json({ message: "Reference range deleted successfully" });
  } catch (error: any) {
    console.error("Delete Reference Range Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
