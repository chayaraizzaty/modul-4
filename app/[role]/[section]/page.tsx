import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { RoleWorkspace } from "../../components/role-frontend";
import { getRoleNavigation, isGymRole } from "../../components/role-config";
import { requirePageRole } from "../../../lib/page-auth";

const dynamicRoles = ["owner", "customer", "cleaning-service"] as const;

export function generateStaticParams() {
  return dynamicRoles.flatMap((role) =>
    getRoleNavigation(role)
      .filter((item) => !item.href.endsWith("/dashboard"))
      .map((item) => ({ role, section: item.href.split("/").at(-1) ?? "" })),
  );
}

async function RoleSectionContent({
  params,
}: {
  params: Promise<{ role: string; section: string }>;
}) {
  await connection();
  const { role, section } = await params;
  if (!isGymRole(role) || role === "admin") notFound();
  if (!getRoleNavigation(role).some((item) => item.href.endsWith(`/${section}`))) {
    notFound();
  }

  await requirePageRole(role);
  return <RoleWorkspace role={role} section={section} />;
}

export default function RoleSectionPage({
  params,
}: {
  params: Promise<{ role: string; section: string }>;
}) {
  return (
    <Suspense fallback={<main className="p-8">Memuat halaman...</main>}>
      <RoleSectionContent params={params} />
    </Suspense>
  );
}
