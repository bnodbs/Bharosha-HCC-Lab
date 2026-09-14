import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import EditTestForm from "./EditTestForm";

export default async function EditTestPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session || session.user.role !== "ADMIN") {
    redirect("/dashboard/tests");
  }

  const test = await prisma.test.findUnique({
    where: { id: params.id },
  });

  if (!test) notFound();

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded-lg shadow border">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Edit Test: {test.code}</h2>
      <EditTestForm test={test} />
    </div>
  );
}
