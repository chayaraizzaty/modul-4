import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import AdminWorkspace from "../../components/admin-frontend";
import { getRoleNavigation } from "../../components/role-config";
import { requirePageRole } from "../../../lib/page-auth";

export function generateStaticParams() {
  return getRoleNavigation("admin")
    .filter((item) => !item.href.endsWith("/dashboard"))
    .map((item) => ({ section: item.href.split("/").at(-1) ?? "" }));
}

async function AdminSectionContent({ params }: { params: Promise<{ section: string }> }) {
  await connection();
  const { section } = await params;
  if (!getRoleNavigation("admin").some((item) => item.href.endsWith(`/${section}`))) {
    notFound();
  }

  await requirePageRole("admin");
  return <AdminWorkspace key={section} section={section} />;
}

export default function AdminSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  return (
    <Suspense fallback={<main className="p-8">Memuat halaman...</main>}>
      <AdminSectionContent params={params} />
    </Suspense>
  );
}
