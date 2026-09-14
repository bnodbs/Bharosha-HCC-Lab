import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ResultEntryForm from "./ResultEntryForm";

export default async function OrderDetailsPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const order = await prisma.labOrder.findUnique({
    where: { id: params.id },
    include: {
      patient: true,
      items: {
        include: {
          test: {
            include: {
              parameters: {
                where: { isActive: true },
                orderBy: { orderIndex: 'asc' },
                include: {
                  referenceRanges: {
                    where: { isActive: true }
                  }
                }
              }
            }
          },
          results: true
        }
      }
    }
  });

  if (!order) notFound();

  const isEditable = session.user.role === "ADMIN" || session.user.role === "LAB_TECHNICIAN";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-2">
        <Link
          href={`/dashboard/patients/${order.patientId}`}
          className="text-gray-500 hover:text-blue-600 flex items-center gap-1 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Patient
        </Link>
      </div>

      {/* Header Info */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex justify-between items-start border-b pb-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Order #{order.orderNumber}</h1>
            <p className="text-sm text-gray-500 mt-1">
              Created: {new Date(order.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="text-right flex flex-col items-end gap-2">
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${
              order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
              order.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' :
              'bg-blue-100 text-blue-800'
            }`}>
              {order.status}
            </span>
            {(order.status === 'PARTIAL' || order.status === 'COMPLETED') && (
               <Link
                  href={`/dashboard/orders/${order.id}/report`}
                  className="mt-2 px-4 py-2 bg-gray-800 text-white text-sm font-medium rounded hover:bg-gray-700 shadow-sm"
               >
                 View / Print Report
               </Link>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div>
            <span className="block text-sm text-gray-500">Patient</span>
            <span className="font-semibold text-blue-600 block">
               <Link href={`/dashboard/patients/${order.patientId}`}>{order.patient.firstName} {order.patient.lastName}</Link>
            </span>
            <span className="text-sm text-gray-500">{order.patient.patientId}</span>
          </div>
          <div>
            <span className="block text-sm text-gray-500">Age / Sex</span>
            <span className="font-semibold">{order.patient.age ? `${order.patient.age}Y` : 'N/A'} / {order.patient.gender}</span>
          </div>
          <div>
            <span className="block text-sm text-gray-500">Referred By</span>
            <span className="font-semibold">{order.referredBy || 'Self'}</span>
          </div>
          <div>
            <span className="block text-sm text-gray-500">Notes</span>
            <span className="text-sm">{order.notes || '-'}</span>
          </div>
        </div>
      </div>

      {/* Result Entry Section */}
      <ResultEntryForm order={order} isEditable={isEditable} />
    </div>
  );
}
