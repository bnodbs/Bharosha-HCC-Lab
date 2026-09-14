import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import ReferenceRangeList from "./ReferenceRangeList";
import { ArrowLeft } from "lucide-react";

export default async function ParameterRangesPage({
  params,
}: {
  params: { id: string; paramId: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  const parameter = await prisma.testParameter.findUnique({
    where: { id: params.paramId, testId: params.id },
    include: {
      test: true,
      referenceRanges: {
        orderBy: [
          { gender: 'asc' },
          { minAge: 'asc' }
        ]
      }
    }
  });

  if (!parameter) notFound();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-4 mb-2">
        <Link
          href={`/dashboard/tests/${params.id}`}
          className="text-gray-500 hover:text-blue-600 flex items-center gap-1 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to {parameter.test.name}
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-start border-b pb-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Reference Ranges
            </h1>
            <p className="text-md text-gray-600 mt-1">
              Parameter: <span className="font-semibold text-blue-600">{parameter.name}</span> {parameter.unit && `(${parameter.unit})`}
            </p>
          </div>
        </div>

        <ReferenceRangeList
          testId={params.id}
          parameterId={parameter.id}
          ranges={parameter.referenceRanges}
          isAdmin={session.user.role === "ADMIN"}
          dataType={parameter.dataType}
          globalUnit={parameter.unit}
        />
      </div>
    </div>
  );
}
