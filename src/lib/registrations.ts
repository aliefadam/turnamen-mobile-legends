import type { Registration } from "@/db/schema";
import { getActiveSeason } from "./seasons";

// Registration augmented with a short-lived signed URL for its payment proof.
export type RegistrationWithProof = Registration & {
  paymentProofUrl: string | null;
};

export type RegistrationStats = {
  totalTeams: number;
  totalSlots: number;
  totalMainPlayers: number;
  totalSubstitutes: number;
  totalRevenue: number;
  latest: RegistrationWithProof[];
  dbError: boolean;
};

/**
 * Fetch all registrations. Uses a dynamic import so a missing/invalid
 * DATABASE_URL degrades gracefully (empty list) instead of crashing the panel.
 * Attaches a signed URL for each payment proof (null if none / storage off).
 */
export async function getAllRegistrations(): Promise<{
  data: RegistrationWithProof[];
  dbError: boolean;
}> {
  return getAllRegistrationsForSeason();
}

export async function getAllRegistrationsForSeason(
  seasonId?: number | null
): Promise<{
  data: RegistrationWithProof[];
  dbError: boolean;
}> {
  try {
    const season = seasonId
      ? { id: seasonId }
      : await getActiveSeason();
    if (!season) return { data: [], dbError: false };

    const { db } = await import("@/db");
    const { registrations } = await import("@/db/schema");
    const { desc, eq } = await import("drizzle-orm");
    const rows = await db
      .select()
      .from(registrations)
      .where(eq(registrations.seasonId, season.id))
      .orderBy(desc(registrations.createdAt));

    const paths = rows
      .map((r) => r.paymentProofPath)
      .filter((p): p is string => !!p);

    let urlMap: Record<string, string> = {};
    if (paths.length > 0) {
      const { getSignedProofUrls } = await import("./supabase");
      urlMap = await getSignedProofUrls(paths);
    }

    const data: RegistrationWithProof[] = rows.map((r) => ({
      ...r,
      paymentProofUrl: r.paymentProofPath
        ? urlMap[r.paymentProofPath] ?? null
        : null,
    }));

    return { data, dbError: false };
  } catch (error) {
    console.error("getAllRegistrations failed:", error);
    return { data: [], dbError: true };
  }
}

/** Fetch a single registration by id, with a signed proof URL attached. */
export async function getRegistrationById(
  id: number
): Promise<RegistrationWithProof | null> {
  if (!Number.isFinite(id)) return null;
  try {
    const season = await getActiveSeason();
    if (!season) return null;

    const { db } = await import("@/db");
    const { registrations } = await import("@/db/schema");
    const { and, eq } = await import("drizzle-orm");

    const rows = await db
      .select()
      .from(registrations)
      .where(and(eq(registrations.id, id), eq(registrations.seasonId, season.id)))
      .limit(1);

    const r = rows[0];
    if (!r) return null;

    let paymentProofUrl: string | null = null;
    if (r.paymentProofPath) {
      const { getSignedProofUrls } = await import("./supabase");
      const map = await getSignedProofUrls([r.paymentProofPath]);
      paymentProofUrl = map[r.paymentProofPath] ?? null;
    }
    return { ...r, paymentProofUrl };
  } catch (error) {
    console.error("getRegistrationById failed:", error);
    return null;
  }
}

export async function getRegistrationStats(): Promise<RegistrationStats> {
  return getRegistrationStatsForSeason();
}

export async function getRegistrationStatsForSeason(
  seasonId?: number | null
): Promise<RegistrationStats> {
  const { data, dbError } = await getAllRegistrationsForSeason(seasonId);

  const totalTeams = data.length;
  const totalSlots = data.reduce((sum, r) => sum + (r.slot ?? 0), 0);
  const totalMainPlayers = totalTeams * 5;
  const totalSubstitutes = data.reduce((sum, r) => {
    let n = 0;
    if (r.sub1Name) n += 1;
    if (r.sub2Name) n += 1;
    return sum + n;
  }, 0);
  // Entry fee: Rp 50.000 per slot
  const totalRevenue = totalSlots * 50000;

  return {
    totalTeams,
    totalSlots,
    totalMainPlayers,
    totalSubstitutes,
    totalRevenue,
    latest: data.slice(0, 5),
    dbError,
  };
}
