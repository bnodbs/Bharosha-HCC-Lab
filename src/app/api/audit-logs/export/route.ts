import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    // Export up to the last 10,000 logs for phase 9 performance limits
    const logs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10000,
      include: {
          user: {
              select: { email: true, name: true, role: true }
          }
      }
    });

    // Helper to safely escape CSV fields (prevent CSV injection like =, +, -, @)
    const escapeCSV = (field: string | null | undefined) => {
        if (!field) return '""';
        let safeField = field.toString().replace(/"/g, '""');
        if (/^[=+\-@]/.test(safeField)) {
            safeField = "'" + safeField;
        }
        return `"${safeField}"`;
    };

    const headers = ["Timestamp", "Actor Name", "Actor Email", "Actor Role", "Action", "Entity Type", "Entity ID", "Details"];

    const csvRows = [headers.join(",")];

    for (const log of logs) {
        const row = [
            escapeCSV(log.createdAt.toISOString()),
            escapeCSV(log.user?.name),
            escapeCSV(log.user?.email),
            escapeCSV(log.user?.role),
            escapeCSV(log.action),
            escapeCSV(log.entityType),
            escapeCSV(log.entityId),
            escapeCSV(log.details)
        ];
        csvRows.push(row.join(","));
    }

    const csvData = csvRows.join("\n");

    const response = new NextResponse(csvData);
    response.headers.set("Content-Type", "text/csv; charset=utf-8");
    response.headers.set("Content-Disposition", `attachment; filename="audit_logs_${new Date().toISOString().split('T')[0]}.csv"`);

    return response;
  } catch (error: any) {
    console.error("Audit Export Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
