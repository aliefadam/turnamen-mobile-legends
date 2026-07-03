import Link from "next/link";
import { getBracket } from "@/lib/bracket";
import BracketBoard from "@/components/BracketBoard";
import SiteFooter from "@/components/SiteFooter";
import AutoRefresh from "@/components/AutoRefresh";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Bracket Turnamen – Warkop Sippo",
};

export default async function PublicBracketPage() {
  const bracket = await getBracket();

  return (
    <main className="min-h-screen bg-white flex flex-col">
      {/* Poll for admin changes (near-realtime) */}
      <AutoRefresh intervalMs={5000} />

      {/* Header */}
      <section className="relative overflow-hidden bg-gradient-to-b from-orange-50 via-amber-50/60 to-white">
        <div className="absolute inset-0 dot-grid opacity-50" />
        <div className="relative z-10 max-w-3xl mx-auto px-4 pt-12 pb-8 text-center">
          <span className="inline-flex items-center gap-1.5 bg-white border border-orange-100 shadow-sm rounded-full px-4 py-1.5 mb-4 text-orange-600 text-xs font-semibold uppercase tracking-widest">
            <i className="fi fi-rr-sitemap" />
            Bagan Turnamen
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 tracking-tight">
            Bracket{" "}
            <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              Mobile Legends
            </span>
          </h1>
          {bracket.champion?.name && (
            <p className="mt-3 inline-flex items-center gap-2 text-sm font-bold text-amber-700 bg-amber-100 px-4 py-1.5 rounded-full">
              <i className="fi fi-rr-trophy" />
              Juara: {bracket.champion.name}
            </p>
          )}
        </div>
      </section>

      <section className="flex-1 w-full max-w-6xl mx-auto px-4 py-8">
        {bracket.exists ? (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 sm:p-6">
            <BracketBoard
              rounds={bracket.rounds}
              totalRounds={bracket.totalRounds}
              champion={bracket.champion}
              mode="view"
            />
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm py-16 px-6 text-center">
            <div className="w-16 h-16 rounded-2xl bg-gray-50 mx-auto flex items-center justify-center mb-4">
              <i className="fi fi-rr-sitemap text-gray-300 text-2xl" />
            </div>
            <h2 className="font-black text-gray-900 mb-1">Bracket belum tersedia</h2>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              Bagan pertandingan akan tampil di sini setelah panitia menyusunnya.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 mt-5 text-sm font-semibold text-orange-600 hover:text-orange-700"
            >
              <i className="fi fi-rr-arrow-small-left" />
              Kembali ke Beranda
            </Link>
          </div>
        )}
      </section>

      <SiteFooter />
    </main>
  );
}
