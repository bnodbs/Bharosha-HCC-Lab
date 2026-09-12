import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { redirect } from "next/navigation";
import ExportForm from "./ExportForm";

export default async function ExportPage() {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow border p-6">
        <div className="border-b pb-4 mb-6 flex items-center justify-between">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Data Export</h2>
                <p className="text-gray-500 mt-1">Extract application data in CSV format.</p>
            </div>
            <div className="bg-red-50 text-red-700 px-3 py-1 rounded text-sm font-bold border border-red-200">
                ADMIN ONLY
            </div>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6 text-sm text-blue-800">
            <p className="font-bold mb-1">Security Notice:</p>
            <p>Exported data may contain sensitive protected health information (PHI). Please ensure downloaded files are stored securely in compliance with local privacy regulations.</p>
        </div>

        <ExportForm />
      </div>
    </div>
  );
}
