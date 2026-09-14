import { prisma } from "@/lib/prisma";

export async function generateOrderId(): Promise<string> {
  // Use a transaction or robust locking if this were a high concurrency system.
  // For safety, we query the latest order and increment safely.
  // Format: ORD-YYYY-XXXXXX
  const date = new Date();
  const year = date.getFullYear();
  const prefix = `ORD-${year}-`;

  const latestOrder = await prisma.labOrder.findFirst({
    where: {
      orderNumber: {
        startsWith: prefix,
      },
    },
    orderBy: {
      orderNumber: 'desc',
    },
  });

  if (!latestOrder) {
    return `${prefix}000001`;
  }

  // Extract the numeric part (last 6 digits)
  const currentNumStr = latestOrder.orderNumber.replace(prefix, '');
  const currentNum = parseInt(currentNumStr, 10);

  if (isNaN(currentNum)) {
    // Fallback if formatting was broken
    const count = await prisma.labOrder.count({ where: { orderNumber: { startsWith: prefix } } });
    return `${prefix}${(count + 1).toString().padStart(6, '0')}`;
  }

  const nextNumStr = (currentNum + 1).toString().padStart(6, '0');
  return `${prefix}${nextNumStr}`;
}
