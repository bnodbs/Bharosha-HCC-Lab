import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import ReportClientView from "./ReportClientView";

export default async function OrderReportPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const order = await prisma.labOrder.findUnique({
    where: { id: params.id },
    include: {
      patient: true,
      items: {
        include: {
          test: true,
          results: {
              include: {
                  parameter: true // Need parameter name to display
              },
              // Sort results by the parameter's display order
              orderBy: {
                  parameter: { orderIndex: 'asc' }
              }
          }
        }
      }
    }
  });

  if (!order) notFound();

  // Optionally fetch lab settings for the header letterhead if Phase 8 settings exist.
  // For now we use basic application header as requested.

  return <ReportClientView order={order} />;
}
