import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import { logAuditAction, AuditAction, AuditEntity } from "@/lib/audit/logger";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    let settings = await prisma.laboratorySettings.findFirst();

    // Return a default structure if none exists yet
    if (!settings) {
        settings = {
            id: 'default',
            labName: 'Bharosha Health Care Center Diagnostic Lab',
            address: 'Kathmandu, Nepal',
            contactPhone: '+977-1-4000000',
            contactEmail: 'lab@bharoshahcc.com',
            logoUrl: null,
            headerText: null,
            footerText: null,
            technicianName: 'Authorized Signatory',
            technicianQualification: null,
            technicianRegistrationNumber: null,
            technicianSig: null,
            createdAt: new Date(),
            updatedAt: new Date()
        };
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Fetch Settings Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

import * as z from "zod";

const settingsSchema = z.object({
  labName: z.string().min(1, "Lab Name is required").max(100),
  address: z.string().max(200).optional().nullable(),
  contactPhone: z.string().max(50).optional().nullable(),
  contactEmail: z.string().email().optional().or(z.literal("")).nullable(),
  logoUrl: z.string().url().optional().or(z.literal("")).nullable(),
  headerText: z.string().max(300).optional().nullable(),
  footerText: z.string().max(300).optional().nullable(),
  technicianName: z.string().max(100).optional().nullable(),
  technicianQualification: z.string().max(100).optional().nullable(),
  technicianRegistrationNumber: z.string().max(100).optional().nullable(),
  technicianSig: z.string().url().optional().or(z.literal("")).nullable(),
});

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const body = await request.json();

    // Normalize empty strings to null for Zod
    const payload = {
        ...body,
        contactEmail: body.contactEmail === "" ? null : body.contactEmail,
        logoUrl: body.logoUrl === "" ? null : body.logoUrl,
        technicianSig: body.technicianSig === "" ? null : body.technicianSig,
    };

    const validatedData = settingsSchema.parse(payload);

    let existing = await prisma.laboratorySettings.findFirst();

    let settings;
    if (existing) {
        settings = await prisma.laboratorySettings.update({
            where: { id: existing.id },
            data: validatedData
        });
    } else {
        settings = await prisma.laboratorySettings.create({
            data: validatedData
        });
    }

    await logAuditAction(session.user.id, AuditAction.UPDATE_SETTINGS, AuditEntity.LAB_SETTINGS, settings.id, `Laboratory settings updated`);

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error("Update Settings Error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Validation error", errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
