import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Fetch quick stats
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [totalPatients, ordersToday, pendingOrders, partialOrders, completedOrders] = await Promise.all([
      prisma.patient.count(),
      prisma.labOrder.count({
          where: {
              createdAt: {
                  gte: today
              }
          }
      }),
      prisma.labOrder.count({
          where: { status: 'PENDING' }
      }),
      prisma.labOrder.count({
          where: { status: 'PARTIAL' }
      }),
      prisma.labOrder.count({
          where: { status: 'COMPLETED' }
      })
  ]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">Laboratory Dashboard</h2>
          <span className="text-gray-500 text-sm">{new Date().toLocaleDateString()}</span>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-center items-center text-center">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Total Patients</h3>
          <p className="text-3xl font-bold text-gray-900 mt-2">{totalPatients}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-center items-center text-center">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Orders Today</h3>
          <p className="text-3xl font-bold text-blue-600 mt-2">{ordersToday}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-center items-center text-center">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Pending</h3>
          <p className="text-3xl font-bold text-gray-700 mt-2">{pendingOrders}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-center items-center text-center">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">In Progress</h3>
          <p className="text-3xl font-bold text-yellow-600 mt-2">{partialOrders}</p>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col justify-center items-center text-center">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Completed</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">{completedOrders}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <h3 className="text-lg font-bold text-gray-800 mt-8 mb-4">Quick Navigation</h3>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <Link href="/dashboard/patients/new" className="bg-blue-50 hover:bg-blue-100 border border-blue-200 p-4 rounded-lg flex items-center justify-center text-blue-800 font-semibold transition-colors shadow-sm">
              + Register Patient
          </Link>
          <Link href="/dashboard/patients" className="bg-white hover:bg-gray-50 border border-gray-200 p-4 rounded-lg flex items-center justify-center text-gray-700 font-semibold transition-colors shadow-sm">
              Find Patient
          </Link>
          <Link href="/dashboard/orders" className="bg-white hover:bg-gray-50 border border-gray-200 p-4 rounded-lg flex items-center justify-center text-gray-700 font-semibold transition-colors shadow-sm">
              All Orders
          </Link>
          <Link href="/dashboard/orders?status=PENDING" className="bg-white hover:bg-gray-50 border border-gray-200 p-4 rounded-lg flex items-center justify-center text-gray-700 font-semibold transition-colors shadow-sm">
              Pending Results
          </Link>
          <Link href="/dashboard/orders?status=COMPLETED" className="bg-white hover:bg-gray-50 border border-gray-200 p-4 rounded-lg flex items-center justify-center text-gray-700 font-semibold transition-colors shadow-sm">
              Completed Reports
          </Link>

          {session.user.role === 'ADMIN' && (
              <>
                  <Link href="/dashboard/settings" className="bg-gray-50 hover:bg-gray-100 border border-gray-300 p-4 rounded-lg flex items-center justify-center text-gray-800 font-semibold transition-colors shadow-sm">
                      Settings
                  </Link>
                  <Link href="/dashboard/audit-logs" className="bg-gray-50 hover:bg-gray-100 border border-gray-300 p-4 rounded-lg flex items-center justify-center text-gray-800 font-semibold transition-colors shadow-sm">
                      Audit Logs
                  </Link>
              </>
          )}
      </div>
    </div>
  );
}
