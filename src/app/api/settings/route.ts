import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";

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
