"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import toast from "react-hot-toast";
import type { RegistrationWithProof } from "@/lib/registrations";

const playerSchema = z.object({
  name: z.string().min(1, "Wajib diisi"),
  mlId: z.string().min(1, "Wajib diisi"),
  server: z.string().min(1, "Wajib diisi"),
});
const optionalPlayerSchema = z.object({
  name: z.string().optional(),
  mlId: z.string().optional(),
  server: z.string().optional(),
});

const schema = z.object({
  teamName: z.string().min(2, "Nama tim minimal 2 karakter"),
  leaderName: z.string().min(2, "Nama ketua minimal 2 karakter"),
  leaderWhatsapp: z
    .string()
    .min(9, "Nomor WhatsApp tidak valid")
    .regex(/^[0-9+\-\s()]+$/, "Hanya angka dan +/-/()"),
  slot: z.number().min(1).max(2),
  players: z.array(playerSchema).length(5),
  substitutes: z.array(optionalPlayerSchema).max(2),
});

type FormData = z.infer<typeof schema>;

export default function EditPesertaForm({
  registration,
}: {
  registration: RegistrationWithProof;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      teamName: registration.teamName,
      leaderName: registration.leaderName,
      leaderWhatsapp: registration.leaderWhatsapp,
      slot: registration.slot,
      players: [
        { name: registration.player1Name, mlId: registration.player1MlId, server: registration.player1Server },
        { name: registration.player2Name, mlId: registration.player2MlId, server: registration.player2Server },
        { name: registration.player3Name, mlId: registration.player3MlId, server: registration.player3Server },
        { name: registration.player4Name, mlId: registration.player4MlId, server: registration.player4Server },
        { name: registration.player5Name, mlId: registration.player5MlId, server: registration.player5Server },
      ],
      substitutes: [
        { name: registration.sub1Name ?? "", mlId: registration.sub1MlId ?? "", server: registration.sub1Server ?? "" },
        { name: registration.sub2Name ?? "", mlId: registration.sub2MlId ?? "", server: registration.sub2Server ?? "" },
      ],
    },
  });

  const slot = watch("slot");

  const handleProof = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("File harus gambar");
    if (file.size > 5 * 1024 * 1024) return toast.error("Maksimal 5MB");
    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
  };

  const onSubmit = async (data: FormData) => {
    setSaving(true);
    try {
      const fd = new FormData();
      fd.append("payload", JSON.stringify(data));
      if (proofFile) fd.append("proof", proofFile);

      const res = await fetch(`/api/admin/registrations/${registration.id}`, {
        method: "PUT",
        body: fd,
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Data berhasil diperbarui");
        router.push("/admin/peserta");
        router.refresh();
      } else {
        toast.error(json.message || "Gagal menyimpan");
      }
    } catch {
      toast.error("Gagal terhubung ke server");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/peserta"
          className="w-9 h-9 rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center justify-center text-gray-600 transition-colors"
          aria-label="Kembali"
        >
          <i className="fi fi-rr-arrow-small-left" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-gray-900">Edit Peserta</h1>
          <p className="text-sm text-gray-500">{registration.teamName}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Info Tim */}
        <Section icon="fi-rr-shield" title="Info Tim">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Nama Tim" error={errors.teamName?.message}>
              <input {...register("teamName")} className={inputCls} />
            </Field>
            <Field label="Nama Ketua" error={errors.leaderName?.message}>
              <input {...register("leaderName")} className={inputCls} />
            </Field>
            <Field label="WhatsApp Ketua" error={errors.leaderWhatsapp?.message}>
              <input {...register("leaderWhatsapp")} className={inputCls} />
            </Field>
            <Field label="Jumlah Slot">
              <div className="grid grid-cols-2 gap-2">
                {[1, 2].map((n) => (
                  <button
                    type="button"
                    key={n}
                    onClick={() => setValue("slot", n, { shouldValidate: true, shouldDirty: true })}
                    aria-pressed={slot === n}
                    className={`px-4 py-2.5 rounded-xl border-2 font-bold text-sm transition-colors
                      ${slot === n ? "border-orange-400 bg-orange-50 text-orange-600" : "border-gray-200 text-gray-500 hover:border-orange-200"}`}
                  >
                    {n} Slot
                  </button>
                ))}
              </div>
            </Field>
          </div>
        </Section>

        {/* Pemain Inti */}
        <Section icon="fi-rr-sword" title="Pemain Inti">
          <div className="space-y-3">
            {[0, 1, 2, 3, 4].map((i) => (
              <PlayerRow
                key={i}
                index={i}
                label={`Pemain ${i + 1}${i === 0 ? " (Captain)" : ""}`}
                register={register}
                prefix={`players.${i}`}
                errors={errors.players?.[i]}
              />
            ))}
          </div>
        </Section>

        {/* Pemain Cadangan */}
        <Section icon="fi-rr-refresh" title="Pemain Cadangan (opsional)">
          <div className="space-y-3">
            {[0, 1].map((i) => (
              <PlayerRow
                key={i}
                index={i}
                label={`Cadangan ${i + 1}`}
                register={register}
                prefix={`substitutes.${i}`}
                optional
              />
            ))}
          </div>
        </Section>

        {/* Bukti Pembayaran */}
        <Section icon="fi-rr-receipt" title="Bukti Pembayaran">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-start">
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1.5">Bukti saat ini</p>
              {registration.paymentProofUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={registration.paymentProofUrl}
                  alt="Bukti pembayaran"
                  className="w-full max-h-48 object-contain rounded-xl border border-gray-100 bg-gray-50"
                />
              ) : (
                <div className="rounded-xl border border-dashed border-gray-200 p-6 text-center text-xs text-gray-400">
                  Belum ada bukti
                </div>
              )}
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1.5">
                Ganti bukti (opsional)
              </p>
              {proofPreview ? (
                <div className="rounded-xl border border-orange-100 overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={proofPreview} alt="Bukti baru" className="w-full max-h-40 object-contain bg-white" />
                  <button
                    type="button"
                    onClick={() => { setProofFile(null); setProofPreview(null); }}
                    className="w-full py-2 text-xs font-semibold text-red-500 hover:bg-red-50 border-t border-gray-100"
                  >
                    Batalkan penggantian
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center gap-1.5 border-2 border-dashed border-orange-200 rounded-xl p-6 cursor-pointer hover:border-orange-400 hover:bg-orange-50/50 transition-all">
                  <i className="fi fi-rr-cloud-upload-alt text-orange-500 text-xl" />
                  <span className="text-xs font-semibold text-gray-600">Pilih gambar baru</span>
                  <span className="text-[11px] text-gray-400">JPG/PNG, maks. 5MB</span>
                  <input type="file" accept="image/*" onChange={handleProof} className="sr-only" />
                </label>
              )}
            </div>
          </div>
        </Section>

        {/* Actions */}
        <div className="flex gap-3 justify-end">
          <Link
            href="/admin/peserta"
            className="px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-colors"
          >
            Batal
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold text-sm shadow-md shadow-orange-200 disabled:opacity-60 btn-press inline-flex items-center gap-2"
          >
            {saving ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Menyimpan...
              </>
            ) : (
              <>
                <i className="fi fi-rr-disk" />
                Simpan Perubahan
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

const inputCls =
  "input-field w-full px-4 py-2.5 rounded-xl bg-gray-50 text-gray-800 placeholder-gray-400 text-sm font-medium";

function Section({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
        <i className={`fi ${icon} text-orange-500`} />
        <h2 className="font-bold text-gray-900 text-sm">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 mb-1.5">{label}</label>
      {children}
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}

function PlayerRow({
  index,
  label,
  register,
  prefix,
  optional = false,
  errors,
}: {
  index: number;
  label: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  register: any;
  prefix: string;
  optional?: boolean;
  errors?: { name?: { message?: string }; mlId?: { message?: string }; server?: { message?: string } };
}) {
  return (
    <div className="rounded-xl border border-gray-100 p-3 bg-gray-50/50">
      <div className="flex items-center gap-2 mb-2">
        <span className="w-5 h-5 rounded-full bg-orange-100 text-orange-500 flex items-center justify-center text-[11px] font-bold">
          {index + 1}
        </span>
        <span className="text-xs font-bold text-gray-700">{label}</span>
        {optional && <span className="ml-auto text-[11px] text-gray-400">Opsional</span>}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div>
          <input {...register(`${prefix}.name`)} placeholder="Nama" className={smallInput} />
          {errors?.name && <p className="text-red-500 text-[11px] mt-0.5">{errors.name.message}</p>}
        </div>
        <div>
          <input {...register(`${prefix}.mlId`)} placeholder="ID ML" className={smallInput} />
          {errors?.mlId && <p className="text-red-500 text-[11px] mt-0.5">{errors.mlId.message}</p>}
        </div>
        <div>
          <input {...register(`${prefix}.server`)} placeholder="Server" className={smallInput} />
          {errors?.server && <p className="text-red-500 text-[11px] mt-0.5">{errors.server.message}</p>}
        </div>
      </div>
    </div>
  );
}

const smallInput =
  "input-field w-full px-3 py-2 rounded-lg bg-white text-gray-800 placeholder-gray-400 text-sm";
