import BracketManager from "@/components/admin/BracketManager";
import { getAdminInfo } from "@/lib/admin-session";
import { getBracket } from "@/lib/bracket";
import {
  getActiveSeason,
  getSeasonBySlug,
  listSeasons,
} from "@/lib/seasons";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Bracket – Admin Panel",
};

async function confirmedCount(seasonId?: number | null): Promise<number> {
  try {
    if (!seasonId) return 0;

    const { db } = await import("@/db");
    const { registrations } = await import("@/db/schema");
    const { and, eq } = await import("drizzle-orm");
    const r = await db
      .select({ slot: registrations.slot })
      .from(registrations)
      .where(
        and(
          eq(registrations.status, "confirmed"),
          eq(registrations.seasonId, seasonId)
        )
      );
    return r.reduce((total, row) => total + Math.max(1, Number(row.slot ?? 1)), 0);
  } catch {
    return 0;
  }
}

export default async function BracketPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string }>;
}) {
  const { season: seasonSlug } = await searchParams;
  const [activeSeason, seasons, requestedSeason, admin] = await Promise.all([
    getActiveSeason(),
    listSeasons(),
    seasonSlug ? getSeasonBySlug(seasonSlug) : Promise.resolve(null),
    getAdminInfo(),
  ]);

  const season = requestedSeason ?? activeSeason;
  const [bracket, cc] = await Promise.all([
    getBracket(season?.id),
    confirmedCount(season?.id),
  ]);
  const isCurrentSeason = Boolean(season && activeSeason && season.id === activeSeason.id);

  return (
    <div className="space-y-6">
      {!isCurrentSeason && season && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-2.5">
          <i className="fi fi-rr-time-past text-blue-500 mt-0.5" />
          <p className="text-sm text-blue-700 font-medium">
            Mode arsip aktif. Bracket season ini bisa dilihat tanpa perlu mengganti season aktif, tetapi aksi pengelolaan dinonaktifkan.
          </p>
        </div>
      )}

      <BracketManager
        bracket={bracket}
        isSuperadmin={admin?.role === "superadmin" && isCurrentSeason}
        confirmedCount={cc}
      />
    </div>
  );
}
