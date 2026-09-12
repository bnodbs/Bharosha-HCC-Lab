import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import EditRangeForm from "../components/EditRangeForm";

export default async function NewReferenceRangePage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard/reference-ranges");
  }

  // Fetch all active tests with their active parameters to populate the selection dropdown
  const tests = await prisma.test.findMany({
    where: { isActive: true },
    orderBy: { displayOrder: 'asc' },
    include: {
      parameters: {
        where: { isActive: true },
        orderBy: { orderIndex: 'asc' }
      }
    }
  });

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow border">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Add Reference Range</h2>
      <EditRangeForm tests={tests} />
    </div>
  );
}
