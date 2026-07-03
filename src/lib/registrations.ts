import type { Registration } from "@/db/schema";

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
  try {
    const { db } = await import("@/db");
    const { registrations } = await import("@/db/schema");
    const { desc } = await import("drizzle-orm");
    const rows = await db
      .select()
      .from(registrations)
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
    const { db } = await import("@/db");
    const { registrations } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");

    const rows = await db
      .select()
      .from(registrations)
      .where(eq(registrations.id, id))
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
  const { data, dbError } = await getAllRegistrations();

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
