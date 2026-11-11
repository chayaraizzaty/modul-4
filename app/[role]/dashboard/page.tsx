import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { RoleWorkspace } from "../../components/role-frontend";
import { isGymRole } from "../../components/role-config";
import { requirePageRole } from "../../../lib/page-auth";

export function generateStaticParams() {
  return ["owner", "customer", "cleaning-service"].map((role) => ({ role }));
}

async function RoleDashboardContent({ params }: { params: Promise<{ role: string }> }) {
  await connection();
  const { role } = await params;
  if (!isGymRole(role) || role === "admin") notFound();

  await requirePageRole(role);
  return <RoleWorkspace role={role} section="dashboard" />;
}

export default function RoleDashboardPage({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  return (
    <Suspense fallback={<main className="p-8">Memuat dashboard...</main>}>
      <RoleDashboardContent params={params} />
    </Suspense>
  );
}
