import Link from "next/link";
import { notFound } from "next/navigation";
import PesertaTable from "@/components/admin/PesertaTable";
import { getAdminInfo } from "@/lib/admin-session";
import { getEventById } from "@/lib/events";
import { getAllRegistrationsForEvent, getRegistrationStatsForEvent } from "@/lib/registrations";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const [event, admin] = await Promise.all([getEventById(id), getAdminInfo()]); if (!event) notFound();
  const [{ data, dbError }, stats] = await Promise.all([getAllRegistrationsForEvent(id), getRegistrationStatsForEvent(id)]);
  return <div className="space-y-6">
    <header className="rounded-3xl bg-gray-950 p-6 text-white sm:p-8"><Link href="/admin/events" className="text-xs font-bold text-orange-300">← Semua event</Link><div className="mt-5 flex flex-wrap items-end justify-between gap-5"><div><p className="text-xs font-black uppercase tracking-[.2em] text-orange-400">Event detail</p><h1 className="mt-2 text-3xl font-black">{event.name}</h1><p className="mt-2 text-sm text-gray-400">{new Date(event.eventDate).toLocaleString("id-ID", { dateStyle: "full", timeStyle: "short" })} · {event.location}</p></div><div className="flex gap-2"><Link href={`/event/${event.slug}`} target="_blank" className="rounded-xl bg-white/10 px-4 py-2 text-sm font-bold">Halaman publik ↗</Link><Link href={`/admin/events/${id}/bracket`} className="rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold">Kelola bracket</Link></div></div></header>
    <div className="grid gap-3 sm:grid-cols-4"><Metric label="Tim" value={stats.totalTeams} /><Metric label="Slot terisi" value={`${stats.totalSlots}/${event.maxSlots}`} /><Metric label="Prize pool" value={`Rp ${event.prizePool.toLocaleString("id-ID")}`} /><Metric label="Dua slot" value={event.allowTwoSlots ? "Diizinkan" : "Tidak"} /></div>
    {dbError && <p className="rounded-xl bg-red-50 p-4 text-sm font-bold text-red-600">Database tidak dapat diakses.</p>}
    <section><div className="mb-4"><h2 className="text-2xl font-black text-gray-900">Peserta</h2><p className="text-sm text-gray-500">Data pendaftar khusus event ini.</p></div><PesertaTable data={data} isSuperadmin={admin?.role === "superadmin"} eventId={id} /></section>
  </div>;
}
function Metric({ label, value }: { label: string; value: string | number }) { return <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"><p className="text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p><p className="mt-2 text-xl font-black text-gray-900">{value}</p></div>; }
