import SeasonManager from "@/components/admin/SeasonManager";
import { getAdminInfo } from "@/lib/admin-session";
import { listSeasons } from "@/lib/seasons";

export const dynamic = "force-dynamic";

export default async function SeasonsPage() {
  const [seasons, admin] = await Promise.all([listSeasons(), getAdminInfo()]);

  if (admin?.role !== "superadmin") {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h1 className="text-2xl font-black text-gray-900">Season</h1>
        <p className="text-sm text-gray-500 mt-2">
          Hanya superadmin yang dapat mengelola season.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Season</h1>
        <p className="text-sm text-gray-500 mt-1">
          Kelola season aktif agar pendaftaran, peserta, dan bracket tetap terpisah.
        </p>
      </div>

      <SeasonManager seasons={seasons} />
    </div>
  );
}
