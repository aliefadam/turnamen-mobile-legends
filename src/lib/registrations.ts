import type { Registration } from "@/db/schema";

export type RegistrationStats = {
  totalTeams: number;
  totalSlots: number;
  totalMainPlayers: number;
  totalSubstitutes: number;
  totalRevenue: number;
  latest: Registration[];
  dbError: boolean;
};

/**
 * Fetch all registrations. Uses a dynamic import so a missing/invalid
 * DATABASE_URL degrades gracefully (empty list) instead of crashing the panel.
 */
export async function getAllRegistrations(): Promise<{
  data: Registration[];
  dbError: boolean;
}> {
  try {
    const { db } = await import("@/db");
    const { registrations } = await import("@/db/schema");
    const { desc } = await import("drizzle-orm");
    const data = await db
      .select()
      .from(registrations)
      .orderBy(desc(registrations.createdAt));
    return { data, dbError: false };
  } catch (error) {
    console.error("getAllRegistrations failed:", error);
    return { data: [], dbError: true };
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
