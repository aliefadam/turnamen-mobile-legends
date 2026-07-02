import { getAllRegistrations } from "@/lib/registrations";
import PesertaTable from "@/components/admin/PesertaTable";

export const dynamic = "force-dynamic";

export default async function PesertaPage() {
  const { data, dbError } = await getAllRegistrations();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Daftar Peserta</h1>
        <p className="text-sm text-gray-500 mt-1">
          Seluruh tim yang telah mendaftar ke turnamen.
        </p>
      </div>

      {dbError && (
        <div className="bg-red-50 border border-red-100 rounded-xl p-4 flex items-start gap-2.5">
          <i className="fi fi-rr-exclamation text-red-500 mt-0.5" />
          <p className="text-sm text-red-600 font-medium">
            Tidak dapat terhubung ke database. Pastikan <code className="font-mono">DATABASE_URL</code> sudah dikonfigurasi.
          </p>
        </div>
      )}

      <PesertaTable data={data} />
    </div>
  );
}
