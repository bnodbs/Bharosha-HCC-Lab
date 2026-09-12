import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import EditPatientForm from "./EditPatientForm";

export default async function EditPatientPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "LAB_TECHNICIAN")) {
    redirect("/dashboard/patients");
  }

  const patient = await prisma.patient.findUnique({
    where: { id: params.id },
  });

  if (!patient) notFound();

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Edit Patient: {patient.patientId}</h2>
      <EditPatientForm patient={patient} />
    </div>
  );
}
