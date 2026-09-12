import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import OrderForm from "./OrderForm";

export default async function NewOrderPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "LAB_TECHNICIAN")) {
    redirect("/dashboard/patients");
  }

  const patient = await prisma.patient.findUnique({
    where: { id: params.id },
  });

  if (!patient) notFound();

  // Fetch all active tests grouped by category for easy selection
  const tests = await prisma.test.findMany({
    where: { isActive: true },
    orderBy: [{ category: 'asc' }, { displayOrder: 'asc' }],
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow border p-6">
        <h2 className="text-xl font-bold text-gray-800 border-b pb-3 mb-4">Patient Information</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="block text-gray-500">Name</span>
            <span className="font-semibold text-gray-900">{patient.firstName} {patient.lastName}</span>
          </div>
          <div>
            <span className="block text-gray-500">Lab ID</span>
            <span className="font-semibold text-blue-600">{patient.patientId}</span>
          </div>
          <div>
            <span className="block text-gray-500">Age / Sex</span>
            <span className="font-semibold text-gray-900">{patient.age ? `${patient.age}y` : 'N/A'} / {patient.gender}</span>
          </div>
          <div>
            <span className="block text-gray-500">Referred By</span>
            <span className="font-semibold text-gray-900">{patient.referredBy || 'Self'}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow border p-6">
        <h2 className="text-xl font-bold text-gray-800 border-b pb-3 mb-4">Create Laboratory Order</h2>
        <OrderForm patientId={patient.id} defaultReferredBy={patient.referredBy || ""} tests={tests} />
      </div>
    </div>
  );
}
