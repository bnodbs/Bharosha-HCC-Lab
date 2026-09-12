import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function OrdersHistoryPage({
  searchParams,
}: {
  searchParams: { query?: string; status?: string; page?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const query = searchParams?.query || "";
  const statusFilter = searchParams?.status || "";
  const currentPage = Math.max(1, Number(searchParams?.page) || 1);
  const itemsPerPage = 15;

  const whereClause: any = {};

  if (query) {
      whereClause.OR = [
          { orderNumber: { contains: query, mode: "insensitive" as const } },
          { patient: { patientId: { contains: query, mode: "insensitive" as const } } },
          { patient: { firstName: { contains: query, mode: "insensitive" as const } } },
          { patient: { lastName: { contains: query, mode: "insensitive" as const } } },
      ];
  }

  if (statusFilter) {
      whereClause.status = statusFilter;
  }

  const totalItems = await prisma.labOrder.count({ where: whereClause });
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const orders = await prisma.labOrder.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    skip: (currentPage - 1) * itemsPerPage,
    take: itemsPerPage,
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

      <div className="bg-white rounded-lg shadow p-6 border">
        <form className="mb-6 flex flex-wrap gap-4">
          <input
            type="text"
            name="query"
            defaultValue={query}
            placeholder="Search by Order ID, Patient Name, Lab ID..."
            className="flex-1 min-w-[300px] p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
          />
          <select
              name="status"
              defaultValue={statusFilter}
              className="p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
              <option value="">All Statuses</option>
              <option value="PENDING">PENDING</option>
              <option value="PARTIAL">PARTIAL (In Progress)</option>
              <option value="COMPLETED">COMPLETED</option>
              <option value="CANCELLED">CANCELLED</option>
          </select>
          <button type="submit" className="px-6 py-2 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 shadow-sm font-medium">
            Search
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-gray-50 text-gray-700">
                <th className="p-3 font-semibold">Order ID</th>
                <th className="p-3 font-semibold">Date</th>
                <th className="p-3 font-semibold">Patient (Lab ID)</th>
                <th className="p-3 font-semibold">Tests</th>
                <th className="p-3 font-semibold">Status</th>
                <th className="p-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order) => (
                <tr key={order.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium text-gray-900">{order.orderNumber}</td>
                  <td className="p-3 text-sm text-gray-600">
                      {new Date(order.createdAt).toLocaleDateString()}<br/>
                      <span className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleTimeString()}</span>
                  </td>
                  <td className="p-3 font-medium text-blue-600">
                    <Link href={`/dashboard/patients/${order.patient.id}`}>
                        {order.patient.firstName} {order.patient.lastName}
                        <br/>
                        <span className="text-xs text-gray-500 font-normal">({order.patient.patientId})</span>
                    </Link>
                  </td>
                  <td className="p-3 text-sm text-gray-600">
                      {order.items.map(i => i.test.code).join(', ')}
                  </td>
                  <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${
                          order.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          order.status === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' :
                          order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                      }`}>
                          {order.status}
                      </span>
                  </td>
                  <td className="p-3 text-right space-x-3">
                      <Link href={`/dashboard/orders/${order.id}/results`} className="text-blue-600 hover:text-blue-800 font-medium text-sm">
                          {order.status === 'COMPLETED' ? 'View Results' : 'Enter Results'}
                      </Link>
                      {(order.status === 'COMPLETED' || order.status === 'PARTIAL') && (
                          <Link href={`/dashboard/orders/${order.id}/report`} className="text-gray-600 hover:text-gray-800 font-medium text-sm border-l pl-3 border-gray-300">
                              Report
                          </Link>
                      )}
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    No orders found matching criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Basic Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-between items-center text-sm text-gray-600 border-t pt-4">
            <div>
              Showing page {currentPage} of {totalPages}
            </div>
            <div className="space-x-2">
              {currentPage > 1 && (
                <Link
                  href={`?query=${query}&status=${statusFilter}&page=${currentPage - 1}`}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Previous
                </Link>
              )}
              {currentPage < totalPages && (
                <Link
                  href={`?query=${query}&status=${statusFilter}&page=${currentPage + 1}`}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Next
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
