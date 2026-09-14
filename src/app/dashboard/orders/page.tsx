import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function OrdersListPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const orders = await prisma.labOrder.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50, // Limit for phase 5
    include: {
      patient: true,
      items: {
          include: { test: true }
      }
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Laboratory Orders</h1>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-4 text-sm font-semibold text-gray-600">Order ID</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Date/Time</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Patient</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Tests</th>
                <th className="p-4 text-sm font-semibold text-gray-600">Status</th>
                <th className="p-4 text-sm font-semibold text-gray-600 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="p-4 text-sm font-medium text-blue-600">
                    <Link href={`/dashboard/orders/${order.id}`}>
                        {order.orderNumber}
                    </Link>
                  </td>
                  <td className="p-4 text-sm text-gray-600">
                    {new Date(order.createdAt).toLocaleString()}
                  </td>
                  <td className="p-4">
                    <div className="text-sm font-medium text-gray-900">
                        {order.patient.firstName} {order.patient.lastName}
                    </div>
                    <div className="text-xs text-gray-500">
                        {order.patient.patientId}
                    </div>
                  </td>
                  <td className="p-4 text-sm text-gray-600 max-w-[200px] truncate">
                    {order.items.map(i => i.test.code).join(', ')}
                  </td>
                  <td className="p-4">
                     <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                        order.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                     }`}>
                        {order.status}
                     </span>
                  </td>
                  <td className="p-4 text-right text-sm">
                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className="text-blue-600 hover:text-blue-800 font-medium bg-blue-50 px-3 py-1 rounded"
                    >
                      {order.status === 'COMPLETED' ? 'View' : 'Enter Results'}
                    </Link>
                  </td>
                </tr>
              ))}

              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    No laboratory orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
