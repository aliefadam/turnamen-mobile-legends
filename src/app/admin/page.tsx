import Link from "next/link";
import { getRegistrationStats } from "@/lib/registrations";

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

export default async function DashboardPage() {
  const stats = await getRegistrationStats();

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
      {stats.dbError && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-2.5">
          <i className="fi fi-rr-exclamation text-red-500 mt-0.5" />
          <p className="text-sm text-red-600 font-medium">
            Tidak dapat terhubung ke database. Pastikan <code className="font-mono">DATABASE_URL</code> sudah dikonfigurasi.
          </p>
        </div>
      )}

      {/* Stat cards */}
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

      {/* Recent registrations */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900 flex items-center gap-2">
            <i className="fi fi-rr-time-past text-orange-500" />
            Pendaftaran Terbaru
          </h2>
          <Link
            href="/admin/peserta"
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
