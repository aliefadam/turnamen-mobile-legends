import type { Event } from "@/db/schema";

export type EventInput = {
  name: string;
  slug?: string;
  eventDate: string | Date;
  location: string;
  prizePool: number;
  maxSlots: number;
  allowTwoSlots: boolean;
  registrationOpen?: boolean;
};

export function slugifyEventName(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 140);
}

export async function listEvents(): Promise<Event[]> {
  const { db } = await import("@/db");
  const { events } = await import("@/db/schema");
  const { desc } = await import("drizzle-orm");
  return db.select().from(events).orderBy(desc(events.eventDate));
}

export async function getEventById(id: number): Promise<Event | null> {
  if (!Number.isFinite(id)) return null;
  const { db } = await import("@/db");
  const { events } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");
  const rows = await db.select().from(events).where(eq(events.id, id)).limit(1);
  return rows[0] ?? null;
}

export async function getEventBySlug(slug: string): Promise<Event | null> {
  const { db } = await import("@/db");
  const { events } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");
  const rows = await db.select().from(events).where(eq(events.slug, slug)).limit(1);
  return rows[0] ?? null;
}

function normalize(input: EventInput) {
  const name = input.name.trim();
  const slug = (input.slug?.trim() || slugifyEventName(name)).slice(0, 140);
  const eventDate = new Date(input.eventDate);
  const location = input.location.trim();
  if (name.length < 2 || !slug || !location || Number.isNaN(eventDate.getTime())) return null;
  return {
    name, slug, eventDate, location,
    prizePool: Math.max(0, Math.trunc(Number(input.prizePool) || 0)),
    maxSlots: Math.max(1, Math.trunc(Number(input.maxSlots) || 1)),
    allowTwoSlots: Boolean(input.allowTwoSlots),
    registrationOpen: input.registrationOpen ?? true,
  };
}

export async function createEvent(input: EventInput) {
  const values = normalize(input);
  if (!values) return { ok: false as const, message: "Data event belum lengkap atau tidak valid." };
  try {
    const { db } = await import("@/db");
    const { events } = await import("@/db/schema");
    const rows = await db.insert(events).values(values).returning();
    return { ok: true as const, event: rows[0] };
  } catch (error) {
    console.error("createEvent failed:", error);
    return { ok: false as const, message: "Slug sudah digunakan atau event gagal dibuat." };
  }
}

export async function updateEvent(id: number, input: EventInput) {
  const values = normalize(input);
  if (!Number.isFinite(id) || !values) return { ok: false as const, message: "Data event tidak valid." };
  try {
    const { db } = await import("@/db");
    const { events } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");
    const rows = await db.update(events).set({ ...values, updatedAt: new Date() }).where(eq(events.id, id)).returning();
    return rows[0] ? { ok: true as const, event: rows[0] } : { ok: false as const, message: "Event tidak ditemukan." };
  } catch (error) {
    console.error("updateEvent failed:", error);
    return { ok: false as const, message: "Slug sudah digunakan atau event gagal diperbarui." };
  }
}

export async function deleteEvent(id: number) {
  const { db } = await import("@/db");
  const { events } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");
  const rows = await db.delete(events).where(eq(events.id, id)).returning({ id: events.id });
  return { ok: rows.length > 0 };
}
