import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Download } from "lucide-react";

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: { page?: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const page = parseInt(searchParams.page || "1", 10);
  const pageSize = 50;
  const skip = (page - 1) * pageSize;

  const [logs, totalCount] = await Promise.all([
    prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
      include: {
          user: {
              select: { email: true, name: true, role: true }
          }
      }
    }),
    prisma.auditLog.count()
  ]);

  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold text-gray-800">Audit Logs</h1>
            <p className="text-sm text-gray-500">System actions and clinical data mutations.</p>
        </div>
        <a
          href="/api/audit-logs/export"
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 shadow-sm text-sm font-medium"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </a>
      </div>

      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-gray-50 border-b">
                <th className="p-3 font-semibold text-gray-600">Timestamp</th>
                <th className="p-3 font-semibold text-gray-600">Actor</th>
                <th className="p-3 font-semibold text-gray-600">Action</th>
                <th className="p-3 font-semibold text-gray-600">Entity</th>
                <th className="p-3 font-semibold text-gray-600">Details</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 text-gray-500 whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                  <td className="p-3">
                    <div className="font-medium text-gray-900">{log.user?.name || log.user?.email || 'System'}</div>
                    {log.user?.role && <div className="text-xs text-blue-600">{log.user.role}</div>}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-1 bg-gray-100 rounded text-xs font-bold text-gray-700">
                        {log.action}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="block text-gray-800 font-medium">{log.entityType}</span>
                    <span className="text-xs text-gray-500 font-mono">{log.entityId}</span>
                  </td>
                  <td className="p-3 text-gray-600 max-w-md truncate" title={log.details || ''}>
                    {log.details || '-'}
                  </td>
                </tr>
              ))}

              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    No audit logs recorded yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
            <div className="p-4 border-t bg-gray-50 flex items-center justify-between text-sm text-gray-600">
                <div>
                    Showing {skip + 1} to {Math.min(skip + pageSize, totalCount)} of {totalCount} logs
                </div>
                <div className="flex gap-2">
                    {page > 1 && (
                        <Link href={`/dashboard/audit-logs?page=${page - 1}`} className="px-3 py-1 bg-white border rounded hover:bg-gray-100">
                            Previous
                        </Link>
                    )}
                    {page < totalPages && (
                        <Link href={`/dashboard/audit-logs?page=${page + 1}`} className="px-3 py-1 bg-white border rounded hover:bg-gray-100">
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
