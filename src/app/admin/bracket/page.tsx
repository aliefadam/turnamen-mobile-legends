import { getBracket } from "@/lib/bracket";
import { getAdminInfo } from "@/lib/admin-session";
import { getActiveSeason } from "@/lib/seasons";
import BracketManager from "@/components/admin/BracketManager";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Bracket – Admin Panel",
};

async function confirmedCount(): Promise<number> {
  try {
    const season = await getActiveSeason();
    if (!season) return 0;

    const { db } = await import("@/db");
    const { registrations } = await import("@/db/schema");
    const { and, eq } = await import("drizzle-orm");
    const r = await db
      .select({ slot: registrations.slot })
      .from(registrations)
      .where(
        and(
          eq(registrations.status, "confirmed"),
          eq(registrations.seasonId, season.id)
        )
      );
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
