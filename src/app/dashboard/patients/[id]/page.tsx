import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";

export default async function PatientProfilePage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { registered?: string; labId?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const patient = await prisma.patient.findUnique({
    where: { id: params.id },
  });

  if (!patient) notFound();

  const isNewlyRegistered = searchParams.registered === "true";

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {isNewlyRegistered && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative">
          <strong className="font-bold">Success! </strong>
          <span className="block sm:inline">
            Patient registered successfully. Lab ID: <span className="font-bold text-lg">{searchParams.labId}</span>
          </span>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-start border-b pb-4 mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">
              {patient.firstName} {patient.lastName}
            </h1>
            <p className="text-lg text-blue-600 font-semibold mt-1">
              Lab ID: {patient.patientId}
            </p>
          </div>
          {(session.user.role === "ADMIN" || session.user.role === "LAB_TECHNICIAN") && (
            <Link
              href={`/dashboard/patients/${patient.id}/edit`}
              className="px-4 py-2 bg-gray-100 border border-gray-300 rounded hover:bg-gray-200"
            >
              Edit Patient
            </Link>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div>
              <span className="text-gray-500 block text-sm">Age</span>
              <span className="font-medium text-gray-800">{patient.age !== null && patient.age !== undefined ? `${patient.age} years` : 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-sm">Date of Birth</span>
              <span className="font-medium text-gray-800">
                {patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'N/A'}
              </span>
            </div>
            <div>
              <span className="text-gray-500 block text-sm">Gender</span>
              <span className="font-medium text-gray-800">{patient.gender}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-sm">Blood Group</span>
              <span className="font-medium text-gray-800">{patient.bloodGroup || 'N/A'}</span>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <span className="text-gray-500 block text-sm">Contact Number</span>
              <span className="font-medium text-gray-800">{patient.contactNumber || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-sm">Address</span>
              <span className="font-medium text-gray-800">{patient.address || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-sm">Referred By</span>
              <span className="font-medium text-gray-800">{patient.referredBy || 'N/A'}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-sm">Registered On</span>
              <span className="font-medium text-gray-800">
                {new Date(patient.createdAt).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        {patient.notes && (
          <div className="mt-6 pt-4 border-t">
            <span className="text-gray-500 block text-sm mb-1">Notes</span>
            <p className="text-gray-800 whitespace-pre-wrap">{patient.notes}</p>
          </div>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Laboratory Orders & Results</h2>
        <div className="text-center py-10 bg-gray-50 rounded border border-dashed border-gray-300">
          <p className="text-gray-500">No orders found.</p>
          <p className="text-sm text-gray-400 mt-2">Order creation will be available in Phase 3.</p>
        </div>
      </div>
    </div>
  );
}
