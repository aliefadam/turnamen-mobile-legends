import type { ReactNode } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { getAdminInfo } from "@/lib/admin-session";

export const metadata = {
  title: "Admin Panel – Warkop Sippo Tournament",
};

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await getAdminInfo();
  return <AdminShell admin={admin}>{children}</AdminShell>;
}
