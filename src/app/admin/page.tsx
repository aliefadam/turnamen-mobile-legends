import Link from "next/link";
import { getRegistrationStatsForSeason } from "@/lib/registrations";
import {
  getActiveSeason,
  getSeasonBySlug,
  listSeasons,
} from "@/lib/seasons";

export const dynamic = "force-dynamic";

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string }>;
}) {
  const { season: seasonSlug } = await searchParams;
  const [activeSeason, seasons, requestedSeason] = await Promise.all([
    getActiveSeason(),
    listSeasons(),
    seasonSlug ? getSeasonBySlug(seasonSlug) : Promise.resolve(null),
  ]);

  const season = requestedSeason ?? activeSeason;
  const stats = await getRegistrationStatsForSeason(season?.id);
  const isArchive = Boolean(season && activeSeason && season.id !== activeSeason.id);

  const cards = [
    {
      label: "Total Tim",
      value: stats.totalTeams,
      icon: "fi-rr-shield",
      tint: "from-amber-400 to-orange-500",
    },
    {
      label: "Total Slot",
      value: stats.totalSlots,
      icon: "fi-rr-ticket",
      tint: "from-orange-400 to-red-500",
    },
    {
      label: "Total Pemain",
      value: stats.totalMainPlayers + stats.totalSubstitutes,
      icon: "fi-rr-users",
      tint: "from-yellow-400 to-amber-500",
    },
    {
      label: "Estimasi Pemasukan",
      value: "Rp " + stats.totalRevenue.toLocaleString("id-ID"),
      icon: "fi-rr-coins",
      tint: "from-green-400 to-emerald-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
            {isArchive ? "Mode Arsip" : "Season Aktif"}
          </p>
          <p className="text-2xl font-black text-gray-900">
            {season?.name ?? "Belum ada season aktif"}
          </p>
          <p className="text-sm text-gray-500 mt-1">
            {season
              ? `${isArchive ? "Melihat histori season ini" : `Pendaftaran ${season.registrationOpen ? "dibuka" : "ditutup"}`} • Maks ${season.maxSlots} slot`
              : "Aktifkan season agar form user dan admin sinkron."}
          </p>
        </div>
        <Link
          href="/admin/seasons"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50"
        >
          <i className="fi fi-rr-layers" />
          Kelola Season
        </Link>
      </div>

      {stats.dbError && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-2.5">
          <i className="fi fi-rr-exclamation text-red-500 mt-0.5" />
          <p className="text-sm text-red-600 font-medium">
            Tidak dapat terhubung ke database. Pastikan <code className="font-mono">DATABASE_URL</code> sudah dikonfigurasi.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((c) => (
          <div
            key={c.label}
            className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5"
          >
            <div
              className={`w-11 h-11 rounded-xl bg-gradient-to-br ${c.tint} flex items-center justify-center mb-3`}
            >
              <i className={`fi ${c.icon} text-white text-lg`} />
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-1">
              {c.label}
            </p>
            <p className="text-2xl font-black text-gray-900">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <i className="fi fi-rr-time-past text-orange-500" />
            Pendaftaran Terbaru
          </h2>
          <Link
            href={season ? `/admin/peserta?season=${encodeURIComponent(season.slug)}` : "/admin/peserta"}
            className="text-sm font-semibold text-orange-600 hover:text-orange-700 flex items-center gap-1"
          >
            Lihat semua
            <i className="fi fi-rr-arrow-small-right" />
          </Link>
        </div>

        {stats.latest.length === 0 ? (
          <div className="p-10 text-center">
            <div className="w-14 h-14 rounded-2xl bg-gray-50 mx-auto flex items-center justify-center mb-3">
              <i className="fi fi-rr-inbox text-gray-300 text-2xl" />
            </div>
            <p className="text-sm text-gray-400">Belum ada pendaftaran.</p>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {stats.latest.map((r) => (
              <li
                key={r.id}
                className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50/60 transition-colors"
              >
                <div className="w-9 h-9 rounded-lg bg-orange-50 text-orange-500 flex items-center justify-center flex-shrink-0">
                  <i className="fi fi-rr-shield text-sm" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm text-gray-800 truncate">
                    {r.teamName}
                  </p>
                  <p className="text-xs text-gray-400 truncate">
                    Ketua: {r.leaderName} • {r.slot} slot
                  </p>
                </div>
                <span className="text-xs text-gray-400 flex-shrink-0 hidden sm:block">
                  {formatDate(r.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
