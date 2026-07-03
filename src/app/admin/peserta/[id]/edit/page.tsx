import Link from "next/link";
import { redirect } from "next/navigation";
import { getRegistrationById } from "@/lib/registrations";
import { getAdminInfo } from "@/lib/admin-session";
import EditPesertaForm from "@/components/admin/EditPesertaForm";

export const dynamic = "force-dynamic";

export default async function EditPesertaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Superadmin only.
  const admin = await getAdminInfo();
  if (admin?.role !== "superadmin") {
    redirect("/admin/peserta");
  }

  const { id } = await params;
  const registration = await getRegistrationById(Number(id));

  if (!registration) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
        <div className="w-14 h-14 rounded-2xl bg-gray-50 mx-auto flex items-center justify-center mb-3">
          <i className="fi fi-rr-ban text-gray-300 text-2xl" />
        </div>
        <h2 className="font-bold text-gray-900 mb-1">Data tidak ditemukan</h2>
        <p className="text-sm text-gray-400 mb-4">
          Peserta yang ingin diedit tidak ada atau sudah dihapus.
        </p>
        <Link
          href="/admin/peserta"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-600 hover:text-orange-700"
        >
          <i className="fi fi-rr-arrow-small-left" />
          Kembali ke Daftar Peserta
        </Link>
      </div>
    );
  }

  return <EditPesertaForm registration={registration} />;
}
