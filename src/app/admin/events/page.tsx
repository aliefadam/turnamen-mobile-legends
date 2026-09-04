import EventManager from "@/components/admin/EventManager";
import { getAdminInfo } from "@/lib/admin-session";
import { listEvents } from "@/lib/events";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const [events, admin] = await Promise.all([listEvents(), getAdminInfo()]);
  return <div className="space-y-6">
    <header><p className="text-xs font-black uppercase tracking-[.2em] text-orange-500">Tournament control</p><h1 className="mt-1 text-3xl font-black text-gray-900">Event</h1><p className="mt-2 text-sm text-gray-500">Satu pusat kendali untuk halaman publik, peserta, dan bracket setiap turnamen.</p></header>
    <EventManager events={events} canManage={admin?.role === "superadmin"} />
  </div>;
}
