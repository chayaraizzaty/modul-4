import { Suspense } from "react";
import { connection } from "next/server";
import AdminWorkspace from "../../components/admin-frontend";
import { requirePageRole } from "../../../lib/page-auth";

export default function AdminDashboard() {
  return (
    <Suspense fallback={<main className="p-8">Memuat dashboard...</main>}>
      <AdminDashboardContent />
    </Suspense>
  );
}

async function AdminDashboardContent() {
  await connection();
  await requirePageRole("admin");
  return <AdminWorkspace section="dashboard" />;
}
