import { notFound } from "next/navigation";
import AppToaster from "@/components/AppToaster";
import HeroSection from "@/components/HeroSection";
import RegistrationForm from "@/components/RegistrationForm";
import SiteFooter from "@/components/SiteFooter";
import FloatingParticles from "@/components/FloatingParticles";
import RundownRulesModal from "@/components/RundownRulesModal";
import { getEventBySlug } from "@/lib/events";

export const dynamic = "force-dynamic";

export default async function EventPublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const event = await getEventBySlug((await params).slug);
  if (!event) notFound();
  return <><AppToaster /><FloatingParticles /><main className="relative min-h-screen bg-white">
    <HeroSection eventName={event.name} registrationOpen={event.registrationOpen} eventDate={event.eventDate} location={event.location} prizePool={event.prizePool} />
    <section className="relative z-10 -mt-10 px-4 pb-4"><div className="mx-auto grid max-w-4xl gap-3 sm:grid-cols-3">
      <Info icon="fi-rr-calendar" label="Jadwal" value={new Date(event.eventDate).toLocaleString("id-ID", { dateStyle: "long", timeStyle: "short" })} />
      <Info icon="fi-rr-marker" label="Lokasi" value={event.location} />
      <Info icon="fi-rr-ticket" label="Kapasitas" value={`${event.maxSlots} slot · ${event.allowTwoSlots ? "Maks. 2 slot/tim" : "1 slot/tim"}`} />
    </div></section>
    <section className="relative z-10 px-4 pt-10 text-center"><h2 className="text-2xl font-black text-gray-900">Sistem <span className="text-orange-500">Pertandingan</span></h2><p className="mt-2 text-sm text-gray-500">Turnamen menggunakan sistem gugur (single elimination).</p><div className="mt-5"><RundownRulesModal /></div></section>
    <section id="daftar" className="relative z-10 scroll-mt-6 pb-8 pt-12"><div className="mb-8 px-4 text-center"><span className="rounded-full bg-orange-100 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-orange-700">Form Pendaftaran</span><h2 className="mt-4 text-3xl font-black text-gray-900">Daftarkan Tim Kamu <span className="text-orange-500">Sekarang!</span></h2></div>
      <RegistrationForm eventSlug={event.slug} registrationOpen={event.registrationOpen} allowTwoSlots={event.allowTwoSlots} />
    </section><SiteFooter /></main></>;
}

function Info({ icon, label, value }: { icon: string; label: string; value: string }) { return <div className="rounded-2xl border border-orange-100 bg-white p-5 shadow-lg shadow-orange-100/50"><i className={`fi ${icon} text-xl text-orange-500`} /><p className="mt-3 text-[10px] font-black uppercase tracking-widest text-gray-400">{label}</p><p className="mt-1 text-sm font-bold text-gray-800">{value}</p></div>; }
