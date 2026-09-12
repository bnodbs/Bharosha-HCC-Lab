import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const order = await prisma.labOrder.findUnique({
      where: { id: params.id },
      include: {
        patient: true,
        items: {
          include: {
            test: true,
            results: {
              include: {
                parameter: true
              }
            }
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json({ message: "Order not found" }, { status: 404 });
    }

    // Sort items by test.displayOrder
    const sortedItems = [...order.items].sort((a, b) => a.test.displayOrder - b.test.displayOrder);

    // Structure and sort results by parameter.orderIndex within each item
    const reportItems = sortedItems.map(item => {
        const sortedResults = [...item.results].sort((a, b) => a.parameter.orderIndex - b.parameter.orderIndex);
        return {
            ...item,
            results: sortedResults
        };
    });

    // We can piggy-back settings to avoid double client fetching
    let settings = await prisma.laboratorySettings.findFirst();
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

    return NextResponse.json({
        order: {
            ...order,
            items: reportItems
        },
        settings
    });

  } catch (error) {
    console.error("Fetch Report Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
