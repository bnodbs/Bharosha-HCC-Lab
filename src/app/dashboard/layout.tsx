import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/authOptions";
import Link from "next/link";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar Placeholder */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4 text-xl font-bold border-b text-blue-600">
          Bharosha Lab
        </div>
        <nav className="p-4">
          <ul>
            <li className="mb-2"><Link href="/dashboard" className="text-gray-700 hover:text-blue-600 block py-1">Dashboard</Link></li>
            <li className="mb-2"><Link href="/dashboard/patients" className="text-gray-700 hover:text-blue-600 block py-1">Patients</Link></li>
            <li className="mb-2 mt-4 text-xs font-semibold text-gray-400 uppercase tracking-wider">Management</li>
            <li className="mb-2"><Link href="/dashboard/tests" className="text-gray-700 hover:text-blue-600 block py-1">Test Master</Link></li>
          </ul>
        </nav>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header Placeholder */}
        <header className="bg-white shadow-sm z-10">
          <div className="flex items-center justify-between p-4">
            <h1 className="text-xl font-semibold text-gray-800">Dashboard</h1>
            <div className="flex items-center gap-4">
              <span className="text-sm text-gray-600">{session.user?.name || session.user?.email}</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
