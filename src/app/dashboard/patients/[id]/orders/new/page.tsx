import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import NewOrderForm from "./NewOrderForm";

export default async function NewOrderPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role === "VIEWER") {
    redirect("/dashboard");
  }

  const patient = await prisma.patient.findUnique({
    where: { id: params.id },
  });

  if (!patient) notFound();

  // Fetch active tests for selection
  const tests = await prisma.test.findMany({
    where: { isActive: true },
    orderBy: [
      { category: 'asc' },
      { displayOrder: 'asc' }
    ]
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">New Laboratory Order</h1>
      <NewOrderForm patient={patient} tests={tests} />
    </div>
  );
}
