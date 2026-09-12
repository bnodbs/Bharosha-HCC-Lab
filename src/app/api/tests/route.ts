import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import * as z from "zod";

const testSchema = z.object({
  code: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional(),
  category: z.string().min(1),
  displayOrder: z.number().int().default(0),
  price: z.number().optional(),
});

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const whereClause: any = { isActive: true };
    if (category) whereClause.category = category;
    if (search) {
      whereClause.OR = [
        { code: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
      ];
    }

    const tests = await prisma.test.findMany({
      where: whereClause,
      orderBy: { displayOrder: 'asc' },
      include: {
        parameters: {
          where: { isActive: true },
          orderBy: { orderIndex: 'asc' }
        }
      }
    });

    return NextResponse.json(tests);
  } catch (error) {
    console.error("Fetch Tests Error:", error);
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
    const validatedData = testSchema.parse(body);

    const existingCode = await prisma.test.findUnique({
      where: { code: validatedData.code }
    });

    if (existingCode) {
       return NextResponse.json({ message: "Test code already exists." }, { status: 400 });
    }

    const test = await prisma.test.create({
      data: validatedData,
    });

    return NextResponse.json({ test }, { status: 201 });
  } catch (error: any) {
    console.error("Test Creation Error:", error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ message: "Validation error", errors: error.errors }, { status: 400 });
    }
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}
