import type { ReactNode } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { getAdminInfo } from "@/lib/admin-session";
import { getActiveSeason, listSeasons } from "@/lib/seasons";

export const metadata = {
  title: "Admin Panel – Warkop Sippo Tournament",
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const [admin, seasons, activeSeason] = await Promise.all([
    getAdminInfo(),
    listSeasons(),
    getActiveSeason(),
  ]);
  return (
    <AdminShell admin={admin} seasons={seasons} activeSeasonSlug={activeSeason?.slug ?? null}>
      {children}
    </AdminShell>
  );
}
