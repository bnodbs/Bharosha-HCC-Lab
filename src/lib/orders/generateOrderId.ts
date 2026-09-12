import { prisma } from "@/lib/prisma";

export async function generateOrderId(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `ORD-${currentYear}-`;

  let retries = 3;
  let nextSequence = 1;

  while (retries > 0) {
    const lastOrder = await prisma.labOrder.findFirst({
      where: {
        orderNumber: {
          startsWith: prefix,
        },
      },
      orderBy: {
        orderNumber: "desc",
      },
    });

    if (lastOrder && lastOrder.orderNumber) {
      const parts = lastOrder.orderNumber.split('-');
      if (parts.length === 3) {
        const lastSequence = parseInt(parts[2], 10);
        if (!isNaN(lastSequence)) {
          nextSequence = lastSequence + 1;
        }
      }
    }

    const paddedSequence = String(nextSequence).padStart(6, '0');
    const proposedId = `${prefix}${paddedSequence}`;

    const existing = await prisma.labOrder.findUnique({
      where: { orderNumber: proposedId }
    });

    if (!existing) {
      return proposedId;
    }

    retries--;
    nextSequence++;
  }

  throw new Error("Failed to generate unique Order ID after multiple attempts.");
}
