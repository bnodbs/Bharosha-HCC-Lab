import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function ReferenceRangesPage({
  searchParams,
}: {
  searchParams: { search?: string; testId?: string; showInactive?: string; sex?: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "LAB_TECHNICIAN")) {
    redirect("/dashboard");
  }

  const search = searchParams?.search || "";
  const testIdFilter = searchParams?.testId || "";
  const sexFilter = searchParams?.sex || "";
  const showInactive = searchParams?.showInactive === "true";

  // Get active tests for dropdown
  const testsRaw = await prisma.test.findMany({
    where: { isActive: true },
    select: { id: true, name: true, code: true },
    orderBy: { displayOrder: 'asc' }
  });

  const whereClause: any = {};

  if (!showInactive) {
    whereClause.isActive = true;
  }

  if (sexFilter) {
    whereClause.gender = sexFilter;
  }

  if (testIdFilter) {
    whereClause.parameter = { testId: testIdFilter };
  }

  if (search) {
    whereClause.parameter = {
        ...whereClause.parameter,
        name: { contains: search, mode: "insensitive" }
    };
  }

  const ranges = await prisma.referenceRange.findMany({
    where: whereClause,
    include: {
      parameter: {
          include: { test: true }
      }
    },
    orderBy: [
      { parameter: { test: { displayOrder: 'asc' } } },
      { parameter: { orderIndex: 'asc' } }
    ]
  });

  return (
    <div className="space-y-6">
      <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded shadow-sm">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-yellow-800">Clinical Verification Required</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Initial default reference ranges are provided for structure only. They must be verified against the laboratory&apos;s specific analyzer, reagent manufacturer&apos;s guidelines, and validated clinical intervals before clinical use.
            </p>
          </div>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Reference Ranges</h1>
        {session.user.role === "ADMIN" && (
          <Link
            href="/dashboard/reference-ranges/new"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow"
          >
            Add Range
          </Link>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6 border">
        <form className="mb-6 flex flex-wrap gap-4 items-center">
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Search parameter..."
            className="p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 min-w-[200px]"
          />
          <select
            name="testId"
            defaultValue={testIdFilter}
            className="p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 bg-white min-w-[200px]"
          >
            <option value="">All Tests</option>
            {testsRaw.map(t => (
                <option key={t.id} value={t.id}>{t.code} - {t.name}</option>
            ))}
          </select>
          <select
            name="sex"
            defaultValue={sexFilter}
            className="p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="">All Genders</option>
            <option value="ALL">Universal (ALL)</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
          </select>
          <label className="flex items-center space-x-2 text-sm text-gray-700 whitespace-nowrap ml-2">
            <input
                type="checkbox"
                name="showInactive"
                value="true"
                defaultChecked={showInactive}
                className="rounded text-blue-600 focus:ring-blue-500"
            />
            <span>Show Inactive</span>
          </label>
          <button type="submit" className="px-6 py-2 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 shadow-sm font-medium">
            Filter
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-gray-50 text-gray-700">
                <th className="p-3 font-semibold">Test / Parameter</th>
                <th className="p-3 font-semibold text-center">Sex</th>
                <th className="p-3 font-semibold text-center">Age Range</th>
                <th className="p-3 font-semibold">Reference</th>
                <th className="p-3 font-semibold">Unit</th>
                {session.user.role === "ADMIN" && <th className="p-3 font-semibold text-right">Actions</th>}
              </tr>
            </thead>
            <tbody>
              {ranges.map((range) => (
                <tr key={range.id} className={`border-b hover:bg-gray-50 transition-colors ${!range.isActive ? 'opacity-60 bg-gray-50' : ''}`}>
                  <td className="p-3">
                    <div className="font-medium text-gray-900">{range.parameter.test.code}</div>
                    <div className="text-sm text-gray-600">{range.parameter.name}</div>
                    {!range.isActive && <span className="text-[10px] bg-red-100 text-red-700 px-1 py-0.5 rounded mt-1 inline-block">INACTIVE</span>}
                  </td>
                  <td className="p-3 text-center text-sm font-medium text-gray-700">
                    {range.gender === 'ALL' ? 'All' : range.gender === 'MALE' ? 'M' : 'F'}
                  </td>
                  <td className="p-3 text-center text-sm text-gray-600">
                    {(range.minAge !== null || range.maxAge !== null)
                        ? `${range.minAge !== null ? range.minAge : 0} - ${range.maxAge !== null ? range.maxAge : '∞'} ${range.ageUnit}`
                        : 'Any'}
                  </td>
                  <td className="p-3">
                    {range.textValue ? (
                       <span className="font-medium text-gray-800">{range.textValue}</span>
                    ) : (
                       <span className="font-medium text-gray-800">
                           {range.minValue !== null ? Number(range.minValue).toString() : '---'}
                           {' to '}
                           {range.maxValue !== null ? Number(range.maxValue).toString() : '---'}
                       </span>
                    )}
                  </td>
                  <td className="p-3 text-gray-600 text-sm">{range.parameter.unit || '-'}</td>

                  {session.user.role === "ADMIN" && (
                      <td className="p-3 text-right">
                        <Link href={`/dashboard/reference-ranges/${range.id}/edit`} className="text-blue-500 hover:text-blue-700 font-medium text-sm">
                            Edit
                        </Link>
                      </td>
                  )}
                </tr>
              ))}
              {ranges.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    No reference ranges found.
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
