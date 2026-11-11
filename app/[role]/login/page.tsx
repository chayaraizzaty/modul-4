import { Suspense } from "react";
import { notFound } from "next/navigation";
import { RoleLogin } from "../../components/role-frontend";
import { isGymRole } from "../../components/role-config";

export function generateStaticParams() {
  return ["owner", "customer", "cleaning-service"].map((role) => ({ role }));
}

async function RoleLoginContent({ params }: { params: Promise<{ role: string }> }) {
  const { role } = await params;
  if (!isGymRole(role) || role === "admin") notFound();

  return <RoleLogin role={role} />;
}

export default function RoleLoginPage({
  params,
}: {
  params: Promise<{ role: string }>;
}) {
  return (
    <Suspense fallback={<main className="p-8">Memuat halaman login...</main>}>
      <RoleLoginContent params={params} />
    </Suspense>
  );
}
