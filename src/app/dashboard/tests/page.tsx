import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function TestsMasterPage({
  searchParams,
}: {
  searchParams: { search?: string; category?: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/dashboard");
  }

  const search = searchParams?.search || "";
  const categoryFilter = searchParams?.category || "";

  // Get distinct categories for filter
  const categoriesRaw = await prisma.test.findMany({
    select: { category: true },
    distinct: ['category'],
  });
  const categories = categoriesRaw.map(c => c.category).sort();

  const whereClause: any = { isActive: true };
  if (categoryFilter) {
    whereClause.category = categoryFilter;
  }
  if (search) {
    whereClause.OR = [
      { code: { contains: search, mode: "insensitive" } },
      { name: { contains: search, mode: "insensitive" } },
    ];
  }

  const tests = await prisma.test.findMany({
    where: whereClause,
    orderBy: { displayOrder: 'asc' },
    include: {
      _count: {
        select: { parameters: { where: { isActive: true } } }
      }
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Laboratory Test Master</h1>
        {session.user.role === "ADMIN" && (
          <Link
            href="/dashboard/tests/new"
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 shadow"
          >
            Add New Test
          </Link>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-6 border">
        <form className="mb-6 flex flex-col md:flex-row gap-4">
          <input
            type="text"
            name="search"
            defaultValue={search}
            placeholder="Search by Code or Name..."
            className="flex-1 p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
          />
          <select
            name="category"
            defaultValue={categoryFilter}
            className="p-2 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 bg-white"
          >
            <option value="">All Categories</option>
            {categories.map(c => (
                <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <button type="submit" className="px-6 py-2 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 shadow-sm font-medium">
            Filter
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b bg-gray-50 text-gray-700">
                <th className="p-3 font-semibold">Code</th>
                <th className="p-3 font-semibold">Name</th>
                <th className="p-3 font-semibold">Category</th>
                <th className="p-3 font-semibold">Parameters</th>
                <th className="p-3 font-semibold">Price</th>
                <th className="p-3 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {tests.map((test) => (
                <tr key={test.id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="p-3 font-medium text-gray-900">{test.code}</td>
                  <td className="p-3 text-blue-600 font-medium">
                    <Link href={`/dashboard/tests/${test.id}`}>{test.name}</Link>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-700 font-medium">
                        {test.category}
                    </span>
                  </td>
                  <td className="p-3 text-gray-600">{test._count.parameters}</td>
                  <td className="p-3 text-gray-600">{test.price ? `₹${test.price.toString()}` : '-'}</td>
                  <td className="p-3 flex space-x-3">
                    <Link href={`/dashboard/tests/${test.id}`} className="text-blue-500 hover:text-blue-700 font-medium">View</Link>
                    {session.user.role === "ADMIN" && (
                      <Link href={`/dashboard/tests/${test.id}/edit`} className="text-gray-500 hover:text-gray-700 font-medium">Edit</Link>
                    )}
                  </td>
                </tr>
              ))}
              {tests.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    No tests found matching criteria.
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
