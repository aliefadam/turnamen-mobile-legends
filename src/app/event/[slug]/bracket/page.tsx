import Link from "next/link";
import { notFound } from "next/navigation";
import { getEventBySlug } from "@/lib/events";
import { getBracket } from "@/lib/bracket";
import BracketBoard from "@/components/BracketBoard";
import AutoRefresh from "@/components/AutoRefresh";

export const dynamic = "force-dynamic";

export default async function EventBracketPage({ params }: { params: Promise<{ slug: string }> }) {
  const event = await getEventBySlug((await params).slug); if (!event) notFound();
  const bracket = await getBracket(event.id);
  return <main className="min-h-screen bg-gradient-to-b from-orange-50 to-white"><AutoRefresh intervalMs={5000} />
    <header className="px-4 py-12 text-center"><p className="text-xs font-black uppercase tracking-[.2em] text-orange-500">Bagan turnamen</p><h1 className="mt-2 text-4xl font-black text-gray-900">{event.name}</h1><Link href={`/event/${event.slug}`} className="mt-4 inline-flex text-sm font-bold text-orange-600">← Kembali ke event</Link></header>
    <section className="mx-auto max-w-6xl px-4 pb-12">{bracket.exists ? <div className="rounded-3xl border border-gray-100 bg-white p-4 shadow-sm sm:p-6"><BracketBoard rounds={bracket.rounds} totalRounds={bracket.totalRounds} champion={bracket.champion} mode="view" /></div> : <div className="rounded-3xl bg-white py-16 text-center text-gray-500">Bracket belum tersedia.</div>}</section>
  </main>;
}
