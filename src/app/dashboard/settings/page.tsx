import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import SettingsForm from "./SettingsForm";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  let initialSettings = await prisma.laboratorySettings.findFirst();
  if (!initialSettings) {
      initialSettings = {
          id: 'default',
          labName: 'Bharosha Health Care Center Diagnostic Lab',
          address: 'Kathmandu, Nepal',
          contactPhone: '+977-1-4000000',
          contactEmail: 'lab@bharoshahcc.com',
          logoUrl: null,
          headerText: null,
          footerText: null,
          technicianName: 'Authorized Signatory',
          technicianQualification: null,
          technicianRegistrationNumber: null,
          technicianSig: null,
          createdAt: new Date(),
          updatedAt: new Date()
      };
  }

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow border space-y-6">
      <div className="border-b pb-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Laboratory Settings</h2>
        <p className="text-gray-500 mt-1">Configure global application settings and report information.</p>
      </div>

      <SettingsForm initialData={initialSettings} />
    </div>
  );
}
