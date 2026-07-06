import type { Season } from "@/db/schema";

export async function getActiveSeason(): Promise<Season | null> {
  try {
    const { db } = await import("@/db");
    const { seasons } = await import("@/db/schema");
    const { eq, desc } = await import("drizzle-orm");

    const active = await db
      .select()
      .from(seasons)
      .where(eq(seasons.isActive, true))
      .orderBy(desc(seasons.createdAt))
      .limit(1);

    return active[0] ?? null;
  } catch (error) {
    console.error("getActiveSeason failed:", error);
    return null;
  }
}

export async function listSeasons(): Promise<Season[]> {
  try {
    const { db } = await import("@/db");
    const { seasons } = await import("@/db/schema");
    const { desc } = await import("drizzle-orm");
    return await db.select().from(seasons).orderBy(desc(seasons.createdAt));
  } catch (error) {
    console.error("listSeasons failed:", error);
    return [];
  }
}

export function slugifySeasonName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 140);
}

export async function createSeason(input: {
  name: string;
  slug?: string;
  makeActive?: boolean;
  registrationOpen?: boolean;
  maxSlots?: number;
}): Promise<{ ok: boolean; message?: string; season?: Season }> {
  const name = input.name.trim();
  if (name.length < 2) return { ok: false, message: "Nama season terlalu pendek." };

  const slug = (input.slug?.trim() || slugifySeasonName(name)).slice(0, 140);
  if (!slug) return { ok: false, message: "Slug season tidak valid." };

  try {
    const { db } = await import("@/db");
    const { seasons } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");

    const existing = await db.select().from(seasons).where(eq(seasons.slug, slug)).limit(1);
    if (existing[0]) {
      return { ok: false, message: "Slug season sudah dipakai." };
    }

    if (input.makeActive) {
      await db.update(seasons).set({ isActive: false });
    }

    const created = await db
      .insert(seasons)
      .values({
        name,
        slug,
        isActive: Boolean(input.makeActive),
        registrationOpen: input.registrationOpen ?? true,
        maxSlots: Math.max(1, Math.trunc(input.maxSlots ?? 100)),
      })
      .returning();

    return { ok: true, season: created[0] };
  } catch (error) {
    console.error("createSeason failed:", error);
    return { ok: false, message: "Gagal membuat season." };
  }
}

export async function activateSeason(
  seasonId: number
): Promise<{ ok: boolean; message?: string }> {
  if (!Number.isFinite(seasonId)) return { ok: false, message: "Season tidak valid." };
  try {
    const { db } = await import("@/db");
    const { seasons } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");

    const found = await db.select().from(seasons).where(eq(seasons.id, seasonId)).limit(1);
    if (!found[0]) return { ok: false, message: "Season tidak ditemukan." };

    await db.update(seasons).set({ isActive: false });
    await db.update(seasons).set({ isActive: true }).where(eq(seasons.id, seasonId));
    return { ok: true };
  } catch (error) {
    console.error("activateSeason failed:", error);
    return { ok: false, message: "Gagal mengaktifkan season." };
  }
}

export async function updateSeasonSettings(
  seasonId: number,
  patch: { registrationOpen?: boolean; maxSlots?: number }
): Promise<{ ok: boolean; message?: string }> {
  if (!Number.isFinite(seasonId)) return { ok: false, message: "Season tidak valid." };
  try {
    const { db } = await import("@/db");
    const { seasons } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");

    const found = await db.select().from(seasons).where(eq(seasons.id, seasonId)).limit(1);
    if (!found[0]) return { ok: false, message: "Season tidak ditemukan." };

    await db
      .update(seasons)
      .set({
        registrationOpen: patch.registrationOpen ?? found[0].registrationOpen,
        maxSlots:
          patch.maxSlots == null
            ? found[0].maxSlots
            : Math.max(1, Math.trunc(patch.maxSlots)),
      })
      .where(eq(seasons.id, seasonId));

    return { ok: true };
  } catch (error) {
    console.error("updateSeasonSettings failed:", error);
    return { ok: false, message: "Gagal memperbarui season." };
  }
}
