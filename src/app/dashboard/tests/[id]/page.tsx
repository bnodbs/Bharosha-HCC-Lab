import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import ParameterList from "./ParameterList";

export default async function TestProfilePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { showInactiveParams?: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/dashboard");
  }

  const showInactive = searchParams?.showInactiveParams === "true";

  const test = await prisma.test.findUnique({
    where: { id: params.id },
    include: {
      parameters: {
        where: !showInactive ? { isActive: true } : undefined,
        orderBy: { orderIndex: 'asc' },
      }
    }
  });

  if (!test) notFound();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-start border-b pb-4 mb-4">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-800">{test.name}</h1>
              {!test.isActive && (
                <span className="px-2 py-1 bg-red-100 text-red-800 text-xs font-bold rounded">INACTIVE</span>
              )}
            </div>
            <p className="text-lg text-blue-600 font-semibold mt-1">Code: {test.code}</p>
          </div>
          {session.user.role === "ADMIN" && (
            <Link
              href={`/dashboard/tests/${test.id}/edit`}
              className="px-4 py-2 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200 shadow-sm"
            >
              Edit Test Details
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="space-y-3">
            <div>
              <span className="text-gray-500 block text-sm">Category</span>
              <span className="font-medium text-gray-800">{test.category}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-sm">Display Order</span>
              <span className="font-medium text-gray-800">{test.displayOrder}</span>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <span className="text-gray-500 block text-sm">Price</span>
              <span className="font-medium text-gray-800">{test.price ? `₹${test.price.toString()}` : 'Not set'}</span>
            </div>
          </div>
        </div>

        {test.description && (
          <div className="mt-4 pt-4 border-t">
            <span className="text-gray-500 block text-sm mb-1">Description</span>
            <p className="text-gray-800 whitespace-pre-wrap">{test.description}</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-gray-800">Test Parameters</h2>
          <div className="flex items-center space-x-4">
            <form>
                <label className="flex items-center space-x-2 text-sm text-gray-700">
                    <input
                        type="checkbox"
                        name="showInactiveParams"
                        value="true"
                        defaultChecked={showInactive}
                        className="rounded text-blue-600 focus:ring-blue-500"
                    />
                    <span>Show Inactive</span>
                </label>
            </form>
            <span className="text-sm text-gray-500">{test.parameters.length} parameters shown</span>
          </div>
        </div>

        <ParameterList
           testId={test.id}
           parameters={test.parameters}
           isAdmin={session.user.role === "ADMIN"}
        />
      </div>
    </div>
  );
}
