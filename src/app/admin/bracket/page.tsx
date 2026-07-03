import { getBracket } from "@/lib/bracket";
import { getAdminInfo } from "@/lib/admin-session";
import BracketManager from "@/components/admin/BracketManager";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Bracket – Admin Panel",
};

async function confirmedCount(): Promise<number> {
  try {
    const { db } = await import("@/db");
    const { registrations } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    const r = await db
      .select({ slot: registrations.slot })
      .from(registrations)
      .where(eq(registrations.status, "confirmed"));
    return r.reduce((total, row) => total + Math.max(1, Number(row.slot ?? 1)), 0);
  } catch {
    return 0;
  }
}

export default async function BracketPage() {
  const [bracket, admin, cc] = await Promise.all([
    getBracket(),
    getAdminInfo(),
    confirmedCount(),
  ]);

  return (
    <BracketManager
      bracket={bracket}
      isSuperadmin={admin?.role === "superadmin"}
      confirmedCount={cc}
    />
  );
}
