import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import EditRangeForm from "../../components/EditRangeForm";

export default async function EditReferenceRangePage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard/reference-ranges");
  }

  const range = await prisma.referenceRange.findUnique({
    where: { id: params.id },
  });

  if (!range) notFound();

  // Fetch tests for the dropdown (though it will be disabled in edit mode, the component expects it)
  const tests = await prisma.test.findMany({
    where: { isActive: true },
    include: {
      parameters: {
        where: { id: range.parameterId }
      }
    }
  });

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow border">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Edit Reference Range</h2>
      <EditRangeForm tests={tests} existingRange={range} />
    </div>
  );
}
