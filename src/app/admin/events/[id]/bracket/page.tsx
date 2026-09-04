import { notFound } from "next/navigation";
import { and, eq } from "drizzle-orm";
import BracketManager from "@/components/admin/BracketManager";
import { getAdminInfo } from "@/lib/admin-session";
import { getBracket } from "@/lib/bracket";
import { getEventById } from "@/lib/events";

export const dynamic = "force-dynamic";

export default async function EventBracketAdminPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id); const event = await getEventById(id); if (!event) notFound();
  const { db } = await import("@/db"); const { registrations } = await import("@/db/schema");
  const [bracket, admin, rows] = await Promise.all([getBracket(id), getAdminInfo(), db.select({ slot: registrations.slot }).from(registrations).where(and(eq(registrations.eventId, id), eq(registrations.status, "confirmed")))]);
  const confirmedCount = rows.reduce((sum, row) => sum + Math.max(1, row.slot), 0);
  return <div className="space-y-5"><div><a href={`/admin/events/${id}`} className="text-sm font-bold text-orange-600">← {event.name}</a></div><BracketManager bracket={bracket} isSuperadmin={admin?.role === "superadmin"} confirmedCount={confirmedCount} eventId={id} publicSlug={event.slug} /></div>;
}
