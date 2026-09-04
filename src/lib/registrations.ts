import type { Registration } from "@/db/schema";

export type RegistrationWithProof = Registration & { paymentProofUrl: string | null };
export type RegistrationStats = {
  totalTeams: number; totalSlots: number; totalMainPlayers: number;
  totalSubstitutes: number; totalRevenue: number; latest: RegistrationWithProof[]; dbError: boolean;
};

export async function getAllRegistrationsForEvent(eventId: number): Promise<{ data: RegistrationWithProof[]; dbError: boolean }> {
  if (!Number.isFinite(eventId)) return { data: [], dbError: false };
  try {
    const { db } = await import("@/db");
    const { registrations } = await import("@/db/schema");
    const { desc, eq } = await import("drizzle-orm");
    const rows = await db.select().from(registrations).where(eq(registrations.eventId, eventId)).orderBy(desc(registrations.createdAt));
    const { getPaymentProofUrls } = await import("./netlify-storage");
    const urls = getPaymentProofUrls(rows.map((r) => r.paymentProofPath).filter((p): p is string => Boolean(p)));
    return { data: rows.map((r) => ({ ...r, paymentProofUrl: r.paymentProofPath ? urls[r.paymentProofPath] ?? null : null })), dbError: false };
  } catch (error) {
    console.error("getAllRegistrationsForEvent failed:", error);
    return { data: [], dbError: true };
  }
}

export async function getRegistrationById(id: number): Promise<RegistrationWithProof | null> {
  if (!Number.isFinite(id)) return null;
  try {
    const { db } = await import("@/db");
    const { registrations } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    const rows = await db.select().from(registrations).where(eq(registrations.id, id)).limit(1);
    const r = rows[0];
    if (!r) return null;
    const { getPaymentProofUrls } = await import("./netlify-storage");
    const urls = r.paymentProofPath ? getPaymentProofUrls([r.paymentProofPath]) : {};
    return { ...r, paymentProofUrl: r.paymentProofPath ? urls[r.paymentProofPath] ?? null : null };
  } catch (error) { console.error("getRegistrationById failed:", error); return null; }
}

export async function getRegistrationStatsForEvent(eventId: number): Promise<RegistrationStats> {
  const { data, dbError } = await getAllRegistrationsForEvent(eventId);
  const totalSlots = data.reduce((sum, r) => sum + Math.max(1, r.slot), 0);
  const totalSubstitutes = data.reduce((sum, r) => sum + Number(Boolean(r.sub1Name)) + Number(Boolean(r.sub2Name)), 0);
  return { totalTeams: data.length, totalSlots, totalMainPlayers: data.length * 5, totalSubstitutes, totalRevenue: totalSlots * 50000, latest: data.slice(0, 5), dbError };
}
