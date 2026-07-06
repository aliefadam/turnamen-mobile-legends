import PesertaTable from "@/components/admin/PesertaTable";
import { getAdminInfo } from "@/lib/admin-session";
import { getAllRegistrationsForSeason } from "@/lib/registrations";
import {
  getActiveSeason,
  getSeasonBySlug,
  listSeasons,
} from "@/lib/seasons";

export const dynamic = "force-dynamic";

export default async function PesertaPage({
  searchParams,
}: {
  searchParams: Promise<{ season?: string }>;
}) {
  const { season: seasonSlug } = await searchParams;
  const [activeSeason, seasons, requestedSeason, admin] = await Promise.all([
    getActiveSeason(),
    listSeasons(),
    seasonSlug ? getSeasonBySlug(seasonSlug) : Promise.resolve(null),
    getAdminInfo(),
  ]);

  const season = requestedSeason ?? activeSeason;
  const { data, dbError } = await getAllRegistrationsForSeason(season?.id);
  const isCurrentSeason = Boolean(season && activeSeason && season.id === activeSeason.id);
  const canManage = admin?.role === "superadmin" && isCurrentSeason;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Daftar Peserta</h1>
        <p className="text-sm text-gray-500 mt-1">
          {season
            ? `Menampilkan peserta untuk ${season.name}${isCurrentSeason ? "" : " (arsip)"}`
            : "Seluruh tim yang telah mendaftar ke turnamen."}
        </p>
      </div>

      {!isCurrentSeason && season && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-2.5">
          <i className="fi fi-rr-time-past text-blue-500 mt-0.5" />
          <p className="text-sm text-blue-700 font-medium">
            Mode arsip aktif. Data season lama bisa dilihat, tetapi aksi edit, hapus, konfirmasi, dan attendance dimatikan.
          </p>
        </div>
      )}

      {dbError && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-2.5">
          <i className="fi fi-rr-exclamation text-red-500 mt-0.5" />
          <p className="text-sm text-red-600 font-medium">
            Tidak dapat terhubung ke database. Pastikan <code className="font-mono">DATABASE_URL</code> sudah dikonfigurasi.
          </p>
        </div>
      )}

      <PesertaTable data={data} isSuperadmin={canManage} />
    </div>
  );
}
