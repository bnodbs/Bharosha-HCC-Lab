import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";

// Safe CSV escaping protecting against formula injection
function escapeCsvValue(value: any): string {
    if (value === null || value === undefined) return '';
    let str = String(value).replace(/"/g, '""'); // Escape existing quotes

    // Prevent formula injection
    if (/^[=+\-@]/.test(str)) {
        str = "'" + str;
    }

    // Wrap in quotes if it contains commas, newlines, or quotes
    if (str.includes(',') || str.includes('\n') || str.includes('"')) {
        return `"${str}"`;
    }
    return str;
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    let whereClause: any = {};

    if (startDate || endDate) {
        whereClause.createdAt = {};
        if (startDate) {
            whereClause.createdAt.gte = new Date(startDate);
        }
        if (endDate) {
            // Include entire end day
            const end = new Date(endDate);
            end.setHours(23, 59, 59, 999);
            whereClause.createdAt.lte = end;
        }
    }

    let csvContent = "";
    let filename = `export-${type}-${new Date().toISOString().split('T')[0]}.csv`;

    if (type === 'patients') {
        const data = await prisma.patient.findMany({ where: whereClause, orderBy: { createdAt: 'desc' } });
        const headers = ["ID", "Lab_ID", "First_Name", "Last_Name", "Age", "DOB", "Gender", "Phone", "Address", "Blood_Group", "Referred_By", "Notes", "Created_At"];
        csvContent += headers.join(',') + '\n';

        for (const p of data) {
            const row = [
                p.id, p.patientId, p.firstName, p.lastName, p.age, p.dateOfBirth?.toISOString(),
                p.gender, p.contactNumber, p.address, p.bloodGroup, p.referredBy, p.notes, p.createdAt.toISOString()
            ].map(escapeCsvValue);
            csvContent += row.join(',') + '\n';
        }
    }
    else if (type === 'orders') {
        const data = await prisma.labOrder.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            include: { patient: true }
        });
        const headers = ["Order_ID", "Order_Number", "Patient_Lab_ID", "Patient_Name", "Referred_By", "Status", "Notes", "Created_At"];
        csvContent += headers.join(',') + '\n';

        for (const o of data) {
            const row = [
                o.id, o.orderNumber, o.patient.patientId, `${o.patient.firstName} ${o.patient.lastName}`,
                o.referredBy, o.status, o.notes, o.createdAt.toISOString()
            ].map(escapeCsvValue);
            csvContent += row.join(',') + '\n';
        }
    }
    else if (type === 'results') {
        const data = await prisma.labResult.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            include: {
                parameter: { include: { test: true } },
                orderItem: { include: { order: { include: { patient: true } } } }
            }
        });
        const headers = ["Result_ID", "Order_Number", "Patient_Lab_ID", "Test_Code", "Parameter_Name", "Value", "Unit", "Abnormal_Flag", "Status", "Ref_Min", "Ref_Max", "Ref_Text", "Created_At"];
        csvContent += headers.join(',') + '\n';

        for (const r of data) {
            const row = [
                r.id, r.orderItem.order.orderNumber, r.orderItem.order.patient.patientId,
                r.parameter.test.code, r.parameter.name, r.value, r.unit, r.abnormalFlag, r.status,
                r.refMinValue, r.refMaxValue, r.refTextValue, r.createdAt.toISOString()
            ].map(escapeCsvValue);
            csvContent += row.join(',') + '\n';
        }
    }
    else if (type === 'auditlogs') {
        const data = await prisma.auditLog.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            include: { user: true }
        });
        const headers = ["Log_ID", "Date", "User_ID", "User_Email", "Action", "Entity_Type", "Entity_ID", "Details"];
        csvContent += headers.join(',') + '\n';

        for (const l of data) {
            const row = [
                l.id, l.createdAt.toISOString(), l.userId, l.user?.email || 'System',
                l.action, l.entityType, l.entityId, l.details
            ].map(escapeCsvValue);
            csvContent += row.join(',') + '\n';
        }
    } else {
        return NextResponse.json({ message: "Invalid export type requested" }, { status: 400 });
    }

    return new NextResponse(csvContent, {
        headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="${filename}"`
        }
    });
  } catch (error) {
    console.error("Data Export Error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
