import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/authOptions";
import { redirect } from "next/navigation";

export default async function PatientsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/login");
  }

  // Viewers shouldn't generally be modifying patients,
  // but they can view the list/profile. The actual "edit" or "new" pages
  // are protected internally in their respective components/API routes.

  return <>{children}</>;
}
