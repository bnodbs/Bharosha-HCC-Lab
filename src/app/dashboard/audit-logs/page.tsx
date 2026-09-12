import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: { action?: string; entity?: string; page?: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const actionFilter = searchParams?.action || "";
  const entityFilter = searchParams?.entity || "";
  const currentPage = Math.max(1, Number(searchParams?.page) || 1);
  const itemsPerPage = 20;

  const whereClause: any = {};
  if (actionFilter) whereClause.action = actionFilter;
  if (entityFilter) whereClause.entityType = entityFilter;

  const totalItems = await prisma.auditLog.count({ where: whereClause });
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const logs = await prisma.auditLog.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    skip: (currentPage - 1) * itemsPerPage,
    take: itemsPerPage,
    include: {
        user: { select: { name: true, email: true, role: true } }
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">System Audit Logs</h1>
      </div>

      <div className="bg-white rounded-lg shadow p-6 border">
        <form className="mb-6 flex flex-wrap gap-4">
          <select
              name="action"
              defaultValue={actionFilter}
              className="p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
              <option value="">All Actions</option>
              <option value="CREATE">CREATE</option>
              <option value="UPDATE">UPDATE</option>
              <option value="DELETE">DELETE</option>
              <option value="SUBMIT_RESULTS">SUBMIT_RESULTS</option>
              <option value="UPDATE_SETTINGS">UPDATE_SETTINGS</option>
          </select>
          <select
              name="entity"
              defaultValue={entityFilter}
              className="p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
              <option value="">All Entities</option>
              <option value="PATIENT">PATIENT</option>
              <option value="LAB_ORDER">LAB_ORDER</option>
              <option value="TEST_MASTER">TEST_MASTER</option>
              <option value="TEST_PARAMETER">TEST_PARAMETER</option>
              <option value="REFERENCE_RANGE">REFERENCE_RANGE</option>
              <option value="LAB_SETTINGS">LAB_SETTINGS</option>
          </select>
          <button type="submit" className="px-6 py-2 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 shadow-sm font-medium">
            Filter
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="border-b bg-gray-50 text-gray-700">
                <th className="p-3 font-semibold">Date / Time</th>
                <th className="p-3 font-semibold">User</th>
                <th className="p-3 font-semibold">Action</th>
                <th className="p-3 font-semibold">Entity</th>
                <th className="p-3 font-semibold">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b hover:bg-gray-50 font-mono text-xs text-gray-800">
                  <td className="p-3 whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="p-3">
                      {log.user ? (
                          <>
                              <span className="font-semibold">{log.user.name || log.user.email}</span><br/>
                              <span className="text-gray-500">[{log.user.role}]</span>
                          </>
                      ) : (
                          <span className="italic text-gray-400">System / Deleted</span>
                      )}
                  </td>
                  <td className="p-3 font-semibold text-blue-700">{log.action}</td>
                  <td className="p-3">
                      {log.entityType}<br/>
                      <span className="text-gray-500 break-all">{log.entityId}</span>
                  </td>
                  <td className="p-3 text-gray-600 break-words max-w-sm">
                      {log.details || '-'}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500 font-sans text-sm">
                    No audit records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-between items-center text-sm text-gray-600 border-t pt-4">
            <div>
              Showing page {currentPage} of {totalPages}
            </div>
            <div className="space-x-2">
              {currentPage > 1 && (
                <Link
                  href={`?action=${actionFilter}&entity=${entityFilter}&page=${currentPage - 1}`}
                  className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                >
                  Previous
                </Link>
              )}
              {currentPage < totalPages && (
                <Link
                  href={`?action=${actionFilter}&entity=${entityFilter}&page=${currentPage + 1}`}
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
