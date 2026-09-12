import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: { query?: string; page?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const query = searchParams?.query || "";
  const currentPage = Number(searchParams?.page) || 1;
  const itemsPerPage = 10;

  const whereClause = query
    ? {
        OR: [
          { patientId: { contains: query, mode: "insensitive" as const } },
          { firstName: { contains: query, mode: "insensitive" as const } },
          { lastName: { contains: query, mode: "insensitive" as const } },
          { contactNumber: { contains: query, mode: "insensitive" as const } },
        ],
      }
    : {};

  const totalItems = await prisma.patient.count({ where: whereClause });
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  const patients = await prisma.patient.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    skip: (currentPage - 1) * itemsPerPage,
    take: itemsPerPage,
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Patients</h1>
        {(session.user.role === "ADMIN" || session.user.role === "LAB_TECHNICIAN") && (
          <Link
            href="/dashboard/patients/new"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Register Patient
          </Link>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <form className="mb-6 flex gap-4">
          <input
            type="text"
            name="query"
            defaultValue={query}
            placeholder="Search by ID, Name, or Phone..."
            className="flex-1 p-2 border border-gray-300 rounded"
          />
          <button type="submit" className="px-4 py-2 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200">
            Search
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-gray-50 text-gray-700">
                <th className="p-3">Lab ID</th>
                <th className="p-3">Name</th>
                <th className="p-3">Age/DOB</th>
                <th className="p-3">Gender</th>
                <th className="p-3">Phone</th>
                <th className="p-3">Referred By</th>
                <th className="p-3">Registered</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((patient) => (
                <tr key={patient.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-medium text-blue-600">
                    <Link href={`/dashboard/patients/${patient.id}`}>{patient.patientId}</Link>
                  </td>
                  <td className="p-3">{patient.firstName} {patient.lastName}</td>
                  <td className="p-3">
                    {patient.age !== null && patient.age !== undefined ? `${patient.age}y` : patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : '-'}
                  </td>
                  <td className="p-3">{patient.gender}</td>
                  <td className="p-3">{patient.contactNumber || '-'}</td>
                  <td className="p-3">{patient.referredBy || '-'}</td>
                  <td className="p-3">{new Date(patient.createdAt).toLocaleDateString()}</td>
                  <td className="p-3 flex space-x-2">
                    <Link href={`/dashboard/patients/${patient.id}`} className="text-blue-500 hover:underline">View</Link>
                    {(session.user.role === "ADMIN" || session.user.role === "LAB_TECHNICIAN") && (
                      <Link href={`/dashboard/patients/${patient.id}/edit`} className="text-green-500 hover:underline">Edit</Link>
                    )}
                  </td>
                </tr>
              ))}
              {patients.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-6 text-center text-gray-500">
                    No patients found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Basic Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-between items-center text-sm text-gray-600">
            <div>
              Showing page {currentPage} of {totalPages}
            </div>
            <div className="space-x-2">
              {currentPage > 1 && (
                <Link
                  href={`?query=${query}&page=${currentPage - 1}`}
                  className="px-3 py-1 border rounded hover:bg-gray-50"
                >
                  Previous
                </Link>
              )}
              {currentPage < totalPages && (
                <Link
                  href={`?query=${query}&page=${currentPage + 1}`}
                  className="px-3 py-1 border rounded hover:bg-gray-50"
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
