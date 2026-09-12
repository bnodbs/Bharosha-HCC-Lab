import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import * as z from "zod";

const patientSchema = z.object({
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  age: z.union([z.number(), z.string().transform(val => val === "" ? undefined : Number(val))]).optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string(),
  contactNumber: z.string().optional(),
  address: z.string().optional(),
  bloodGroup: z.string().optional(),
  referredBy: z.string().optional(),
  notes: z.string().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "LAB_TECHNICIAN")) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = patientSchema.parse(body);

    const patient = await prisma.patient.update({
      where: { id: params.id },
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        age: typeof validatedData.age === 'number' ? validatedData.age : null,
        dateOfBirth: validatedData.dateOfBirth ? new Date(validatedData.dateOfBirth) : null,
        gender: validatedData.gender,
        contactNumber: validatedData.contactNumber,
        address: validatedData.address,
        bloodGroup: validatedData.bloodGroup,
        referredBy: validatedData.referredBy,
        notes: validatedData.notes,
      },
    });

    return NextResponse.json({ patient });
  } catch (error: any) {
    console.error("Patient Update Error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Validation error", errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
