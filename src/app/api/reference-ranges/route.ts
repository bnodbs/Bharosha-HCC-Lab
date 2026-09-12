import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import * as z from "zod";

const rangeSchema = z.object({
  parameterId: z.string().min(1),
  gender: z.enum(["MALE", "FEMALE", "ALL"]).default("ALL"),
  minAge: z.number().int().nonnegative().nullable().optional(),
  maxAge: z.number().int().nonnegative().nullable().optional(),
  ageUnit: z.enum(["DAYS", "MONTHS", "YEARS"]).default("YEARS"),
  minValue: z.number().nullable().optional(),
  maxValue: z.number().nullable().optional(),
  textValue: z.string().nullable().optional(),
  isCritical: z.boolean().default(false),
  isActive: z.boolean().default(true),
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

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const parameterId = searchParams.get('parameterId');
    const isActive = searchParams.get('isActive');

    const whereClause: any = {};
    if (parameterId) whereClause.parameterId = parameterId;
    if (isActive !== null && isActive !== undefined) {
        whereClause.isActive = isActive === 'true';
    }

    const ranges = await prisma.referenceRange.findMany({
      where: whereClause,
      include: {
        parameter: {
            include: { test: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json(ranges);
  } catch (error) {
    console.error("Fetch Reference Ranges Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();

    // Normalize empty strings to null for Zod
    const payload = {
        ...body,
        minAge: body.minAge === "" ? null : body.minAge,
        maxAge: body.maxAge === "" ? null : body.maxAge,
        minValue: body.minValue === "" ? null : body.minValue,
        maxValue: body.maxValue === "" ? null : body.maxValue,
        textValue: body.textValue === "" ? null : body.textValue,
    };

    const validatedData = rangeSchema.parse(payload);

    const range = await prisma.referenceRange.create({
      data: validatedData,
    });

    return NextResponse.json({ range }, { status: 201 });
  } catch (error: any) {
    console.error("Reference Range Creation Error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Validation error", errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
