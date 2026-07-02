"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import toast from "react-hot-toast";

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

const formSchema = z.object({
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

type FormData = z.infer<typeof formSchema>;

const defaultPlayer = { name: "", mlId: "", server: "" };

export default function RegistrationForm() {
  const [step, setStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [proofPreview, setProofPreview] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar (JPG/PNG)");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5MB");
      return;
    }
    setProofFile(file);
    setProofPreview(URL.createObjectURL(file));
  };

  const removeProof = () => {
    if (proofPreview) URL.revokeObjectURL(proofPreview);
    setProofFile(null);
    setProofPreview(null);
  };

  const copyAccount = async () => {
    try {
      await navigator.clipboard.writeText("6170629785");
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Gagal menyalin nomor rekening");
    }
  };

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    trigger,
    watch,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      teamName: "",
      leaderName: "",
      leaderWhatsapp: "",
      slot: 1,
      players: [
        defaultPlayer,
        defaultPlayer,
        defaultPlayer,
        defaultPlayer,
        defaultPlayer,
      ],
      substitutes: [defaultPlayer, defaultPlayer],
    },
  });

  const steps = [
    { title: "Info Tim", icon: "fi-rr-shield" },
    { title: "Pemain Inti", icon: "fi-rr-sword" },
    { title: "Cadangan", icon: "fi-rr-refresh" },
    { title: "Konfirmasi", icon: "fi-rr-badge-check" },
  ];

  const playerFields = [0, 1, 2, 3, 4];
  const subFields = [0, 1];

  const watchAll = watch();

  const nextStep = async () => {
    let fields: (keyof FormData)[] = [];
    if (step === 0)
      fields = ["teamName", "leaderName", "leaderWhatsapp", "slot"];
    if (step === 1) fields = ["players"];

    const valid = await trigger(fields);
    if (valid) setStep((s) => s + 1);
  };

  const prevStep = () => setStep((s) => s - 1);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();

      if (json.success) {
        setSuccess(true);
        toast.success("Pendaftaran berhasil!");
      } else {
        toast.error(json.message || "Terjadi kesalahan");
      }
    } catch {
      toast.error("Gagal terhubung ke server");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (success) {
    return <SuccessScreen teamName={watchAll.teamName} slot={watchAll.slot} />;
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-4 pb-16">
      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center justify-center gap-0">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center">
              <motion.button
                type="button"
                onClick={() => i < step && setStep(i)}
                className={`flex flex-col items-center gap-1 cursor-default`}
                whileHover={i < step ? { scale: 1.05 } : {}}
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300
                    ${
                      i === step
                        ? "bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-lg shadow-orange-200"
                        : i < step
                          ? "bg-green-500 text-white"
                          : "bg-gray-100 text-gray-400"
                    }`}
                >
                  <i className={`fi ${i < step ? "fi-rr-check" : s.icon}`} />
                </div>
                <span
                  className={`text-xs font-semibold hidden sm:block
                    ${i === step ? "text-orange-500" : i < step ? "text-green-500" : "text-gray-400"}`}
                >
                  {s.title}
                </span>
              </motion.button>
              {i < steps.length - 1 && (
                <div
                  className={`h-0.5 w-12 sm:w-16 mx-1 rounded-full transition-all duration-500
                    ${i < step ? "bg-gradient-to-r from-amber-400 to-orange-500" : "bg-gray-200"}`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Form Card */}
      <motion.div
        className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Card Header */}
        <div className="bg-gradient-to-r from-amber-400 to-orange-500 p-6">
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <i className={`fi ${steps[step].icon} text-lg`} />
            </span>
            {steps[step].title}
          </h2>
          <p className="text-white/80 text-sm mt-2">
            {step === 0 && "Masukkan informasi dasar tim kamu"}
            {step === 1 && "Daftarkan 5 pemain inti tim kamu"}
            {step === 2 && "Pemain cadangan (opsional, maks. 2 orang)"}
            {step === 3 && "Periksa kembali data sebelum mengirim"}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="p-6">
            <AnimatePresence mode="wait">
              {/* STEP 0: Team Info */}
              {step === 0 && (
                <motion.div
                  key="step0"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Nama Tim <span className="text-orange-500">*</span>
                    </label>
                    <input
                      {...register("teamName")}
                      placeholder="Contoh: Team Alpha"
                      className="input-field w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-800 placeholder-gray-400 text-sm font-medium"
                    />
                    {errors.teamName && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.teamName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      Nama Ketua Tim <span className="text-orange-500">*</span>
                    </label>
                    <input
                      {...register("leaderName")}
                      placeholder="Nama lengkap ketua"
                      className="input-field w-full px-4 py-3 rounded-xl bg-gray-50 text-gray-800 placeholder-gray-400 text-sm font-medium"
                    />
                    {errors.leaderName && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.leaderName.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                      WhatsApp Ketua <span className="text-orange-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">
                        +62
                      </span>
                      <input
                        {...register("leaderWhatsapp")}
                        placeholder="08xxxxxxxxxx"
                        className="input-field w-full pl-14 pr-4 py-3 rounded-xl bg-gray-50 text-gray-800 placeholder-gray-400 text-sm font-medium"
                      />
                    </div>
                    {errors.leaderWhatsapp && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.leaderWhatsapp.message}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Jumlah Slot <span className="text-orange-500">*</span>
                    </label>
                    <p className="text-xs text-gray-500 mb-3">
                      Setiap slot seharga 50K (maksimal 2 slot)
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {[1, 2].map((n) => (
                        <label
                          key={n}
                          className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 cursor-pointer transition-all duration-200
                            ${
                              watchAll.slot === n
                                ? "border-orange-400 bg-orange-50"
                                : "border-gray-200 hover:border-orange-200"
                            }`}
                        >
                          <input
                            type="radio"
                            value={n}
                            {...register("slot", { valueAsNumber: true })}
                            className="sr-only"
                          />
                          <span
                            className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg font-black transition-colors
                              ${watchAll.slot === n ? "bg-orange-500 text-white" : "bg-gray-100 text-gray-500"}`}
                          >
                            {n}
                          </span>
                          <span className="font-bold text-gray-800">
                            {n} Slot
                          </span>
                          <span className="text-xs text-gray-500">
                            Rp {n === 1 ? "50.000" : "100.000"}
                          </span>
                          {watchAll.slot === n && (
                            <div className="absolute top-2 right-2 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                              <i className="fi fi-rr-check text-white text-[10px]" />
                            </div>
                          )}
                        </label>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* STEP 1: Main Players */}
              {step === 1 && (
                <motion.div
                  key="step1"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {playerFields.map((pi) => (
                    <PlayerCard
                      key={pi}
                      index={pi}
                      label={`Pemain ${pi + 1}${pi === 0 ? " (Captain)" : ""}`}
                      register={register}
                      prefix={`players.${pi}`}
                      errors={errors?.players?.[pi]}
                    />
                  ))}
                </motion.div>
              )}

              {/* STEP 2: Substitutes */}
              {step === 2 && (
                <motion.div
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-2 flex items-start gap-2.5">
                    <i className="fi fi-rr-bulb text-amber-500 text-base mt-0.5" />
                    <p className="text-sm text-amber-700 font-medium">
                      Pemain cadangan bersifat opsional. Kamu bisa mengosongkan
                      bagian ini.
                    </p>
                  </div>
                  {subFields.map((si) => (
                    <PlayerCard
                      key={si}
                      index={si}
                      label={`Cadangan ${si + 1}`}
                      register={register}
                      prefix={`substitutes.${si}`}
                      optional
                      errors={undefined}
                    />
                  ))}
                </motion.div>
              )}

              {/* STEP 3: Confirmation */}
              {step === 3 && (
                <motion.div
                  key="step3"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-5"
                >
                  {/* Team Summary */}
                  <ConfirmSection icon="fi-rr-shield" title="Info Tim">
                    <ConfirmRow label="Nama Tim" value={watchAll.teamName} />
                    <ConfirmRow label="Ketua" value={watchAll.leaderName} />
                    <ConfirmRow
                      label="WhatsApp"
                      value={watchAll.leaderWhatsapp}
                    />
                    <ConfirmRow
                      label="Slot"
                      value={`${watchAll.slot} Slot (Rp ${watchAll.slot === 1 ? "50.000" : "100.000"})`}
                    />
                  </ConfirmSection>

                  <ConfirmSection icon="fi-rr-sword" title="Pemain Inti">
                    {watchAll.players?.map((p, i) => (
                      <ConfirmPlayerRow
                        key={i}
                        label={`Pemain ${i + 1}${i === 0 ? " (Captain)" : ""}`}
                        name={p.name}
                        mlId={p.mlId}
                        server={p.server}
                      />
                    ))}
                  </ConfirmSection>

                  {watchAll.substitutes?.some((s) => s.name) && (
                    <ConfirmSection
                      icon="fi-rr-refresh"
                      title="Pemain Cadangan"
                    >
                      {watchAll.substitutes
                        ?.filter((s) => s.name)
                        .map((s, i) => (
                          <ConfirmPlayerRow
                            key={i}
                            label={`Cadangan ${i + 1}`}
                            name={s.name ?? ""}
                            mlId={s.mlId ?? ""}
                            server={s.server ?? ""}
                          />
                        ))}
                    </ConfirmSection>
                  )}

                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-orange-200 rounded-xl p-4 flex items-center justify-center gap-2">
                    <i className="fi fi-rr-gamepad text-orange-500" />
                    <p className="text-sm text-gray-700 font-medium text-center">
                      Pastikan semua data sudah benar sebelum mengirim
                      pendaftaran
                    </p>
                  </div>

                  {/* Payment Instructions */}
                  <div className="rounded-2xl border border-orange-100 overflow-hidden">
                    <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
                      <i className="fi fi-rr-coins text-orange-500 text-sm" />
                      <h3 className="font-bold text-sm text-gray-700">
                        Pembayaran
                      </h3>
                    </div>
                    <div className="p-4 space-y-3">
                      <p className="text-sm text-gray-600">
                        Harap transfer sejumlah{" "}
                        <span className="font-bold text-orange-500">
                          Rp {watchAll.slot === 1 ? "50.000" : "100.000"}
                        </span>{" "}
                        ke rekening berikut:
                      </p>

                      <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-orange-100 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-blue-600 text-white text-xs font-black px-2 py-1 rounded">
                            BCA
                          </span>
                          <span className="text-xs text-gray-500 font-medium">
                            A/n Alief Sya&apos;arah Adam
                          </span>
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-lg font-black text-gray-800 tracking-wider tabular-nums">
                            6170629785
                          </span>
                          <button
                            type="button"
                            onClick={copyAccount}
                            className="flex items-center gap-1.5 text-xs font-semibold text-orange-600 bg-white border border-orange-200 rounded-lg px-3 py-1.5 hover:bg-orange-50 transition-colors btn-press"
                          >
                            <i
                              className={`fi ${copied ? "fi-rr-check" : "fi-rr-copy"}`}
                            />
                            {copied ? "Tersalin" : "Salin"}
                          </button>
                        </div>
                      </div>

                      {/* Upload Proof */}
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                          Upload Bukti Pembayaran{" "}
                          <span className="text-orange-500">*</span>
                        </label>
                        {!proofPreview ? (
                          <label className="group flex flex-col items-center justify-center gap-2 border-2 border-dashed border-orange-200 rounded-xl p-6 cursor-pointer hover:border-orange-400 hover:bg-orange-50/50 transition-all">
                            <div className="w-12 h-12 rounded-xl bg-orange-50 group-hover:bg-orange-100 flex items-center justify-center transition-colors">
                              <i className="fi fi-rr-cloud-upload-alt text-orange-500 text-xl" />
                            </div>
                            <p className="text-sm font-semibold text-gray-600">
                              Klik untuk memilih gambar
                            </p>
                            <p className="text-xs text-gray-400">
                              JPG atau PNG, maks. 5MB
                            </p>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleProofChange}
                              className="sr-only"
                            />
                          </label>
                        ) : (
                          <div className="relative rounded-xl border border-orange-100 overflow-hidden bg-gray-50">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={proofPreview}
                              alt="Bukti pembayaran"
                              className="w-full max-h-56 object-contain bg-white"
                            />
                            <div className="flex items-center justify-between gap-2 px-3 py-2 bg-white border-t border-gray-100">
                              <span className="flex items-center gap-1.5 text-xs font-medium text-green-600 min-w-0">
                                <i className="fi fi-rr-check-circle" />
                                <span className="truncate">
                                  {proofFile?.name}
                                </span>
                              </span>
                              <button
                                type="button"
                                onClick={removeProof}
                                className="flex items-center gap-1 text-xs font-semibold text-red-500 hover:text-red-600 flex-shrink-0"
                              >
                                <i className="fi fi-rr-trash" />
                                Hapus
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Navigation Buttons */}
          <div className="px-6 pb-6 flex gap-3">
            {step > 0 && (
              <button
                type="button"
                onClick={prevStep}
                className="flex-1 px-6 py-3 rounded-xl border-2 border-gray-200 text-gray-600 font-semibold text-sm hover:bg-gray-50 transition-all duration-200 btn-press inline-flex items-center justify-center gap-1.5"
              >
                <i className="fi fi-rr-arrow-small-left text-base" />
                Kembali
              </button>
            )}
            {step < steps.length - 1 ? (
              <motion.button
                type="button"
                onClick={nextStep}
                className="flex-1 px-6 py-3 rounded-xl shimmer text-white font-bold text-sm shadow-md shadow-orange-200 btn-press inline-flex items-center justify-center gap-1.5"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
              >
                Lanjut
                <i className="fi fi-rr-arrow-small-right text-base" />
              </motion.button>
            ) : (
              <motion.button
                type="submit"
                disabled={isSubmitting || !proofFile}
                title={
                  !proofFile
                    ? "Upload bukti pembayaran terlebih dahulu"
                    : undefined
                }
                className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold text-sm shadow-md shadow-orange-200 disabled:opacity-60 disabled:cursor-not-allowed btn-press"
                whileHover={proofFile && !isSubmitting ? { scale: 1.02 } : {}}
                whileTap={proofFile && !isSubmitting ? { scale: 0.97 } : {}}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <LoadingSpinner />
                    Mendaftarkan...
                  </span>
                ) : (
                  <span className="flex items-center justify-center gap-2">
                    <i className="fi fi-rr-rocket text-base" />
                    Daftar Sekarang!
                  </span>
                )}
              </motion.button>
            )}
          </div>
        </form>
      </motion.div>
    </div>
  );
}

// Player Card Component
function PlayerCard({
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
  errors?: {
    name?: { message?: string };
    mlId?: { message?: string };
    server?: { message?: string };
  };
}) {
  const colors = [
    "from-amber-400 to-orange-500",
    "from-orange-400 to-red-500",
    "from-yellow-400 to-amber-500",
    "from-amber-500 to-orange-600",
    "from-orange-500 to-red-600",
  ];
  const color = colors[index % colors.length];

  return (
    <div className="rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      <div
        className={`bg-gradient-to-r ${color} px-4 py-2.5 flex items-center gap-2`}
      >
        <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center text-white text-xs font-bold">
          {index + 1}
        </div>
        <span className="text-white font-bold text-sm">{label}</span>
        {optional && (
          <span className="ml-auto text-white/70 text-xs font-medium">
            Opsional
          </span>
        )}
      </div>
      <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-gray-50/50">
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            Nama Lengkap{" "}
            {!optional && <span className="text-orange-500">*</span>}
          </label>
          <input
            {...register(`${prefix}.name`)}
            placeholder="Nama lengkap"
            className="input-field w-full px-3 py-2.5 rounded-lg bg-white text-gray-800 placeholder-gray-400 text-sm"
          />
          {errors?.name && (
            <p className="text-red-500 text-xs mt-0.5">{errors.name.message}</p>
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            ID Mobile Legend{" "}
            {!optional && <span className="text-orange-500">*</span>}
          </label>
          <input
            {...register(`${prefix}.mlId`)}
            placeholder="Contoh: 12345678"
            className="input-field w-full px-3 py-2.5 rounded-lg bg-white text-gray-800 placeholder-gray-400 text-sm"
          />
          {errors?.mlId && (
            <p className="text-red-500 text-xs mt-0.5">{errors.mlId.message}</p>
          )}
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 mb-1">
            Server {!optional && <span className="text-orange-500">*</span>}
          </label>
          <input
            {...register(`${prefix}.server`)}
            placeholder="Contoh: 2345"
            className="input-field w-full px-3 py-2.5 rounded-lg bg-white text-gray-800 placeholder-gray-400 text-sm"
          />
          {errors?.server && (
            <p className="text-red-500 text-xs mt-0.5">
              {errors.server.message}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// Confirm Section
function ConfirmSection({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-gray-100 overflow-hidden">
      <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-100 flex items-center gap-2">
        <i className={`fi ${icon} text-orange-500 text-sm`} />
        <h3 className="font-bold text-sm text-gray-700">{title}</h3>
      </div>
      <div className="p-4 space-y-2">{children}</div>
    </div>
  );
}

// Confirm Row
function ConfirmRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center py-1">
      <span className="text-xs text-gray-500 font-medium">{label}</span>
      <span className="text-xs text-gray-800 font-semibold text-right max-w-[60%]">
        {value}
      </span>
    </div>
  );
}

// Confirm Player Row
function ConfirmPlayerRow({
  label,
  name,
  mlId,
  server,
}: {
  label: string;
  name: string;
  mlId: string;
  server: string;
}) {
  return (
    <div className="py-1.5 border-b border-gray-50 last:border-0">
      <p className="text-xs font-bold text-orange-500 mb-1">{label}</p>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <p className="text-xs text-gray-400">Nama</p>
          <p className="text-xs font-semibold text-gray-700">{name || "-"}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">ML ID</p>
          <p className="text-xs font-semibold text-gray-700">{mlId || "-"}</p>
        </div>
        <div>
          <p className="text-xs text-gray-400">Server</p>
          <p className="text-xs font-semibold text-gray-700">{server || "-"}</p>
        </div>
      </div>
    </div>
  );
}

// Loading Spinner
function LoadingSpinner() {
  return (
    <svg
      className="animate-spin h-4 w-4 text-white"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
      />
    </svg>
  );
}

// Success Screen
function SuccessScreen({ teamName, slot }: { teamName: string; slot: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="max-w-md mx-auto px-4 pb-16"
    >
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden text-center">
        <div className="bg-gradient-to-r from-amber-400 to-orange-500 p-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="w-24 h-24 bg-white rounded-full mx-auto flex items-center justify-center shadow-lg"
          >
            <i className="fi fi-rr-check-circle text-orange-500 text-5xl" />
          </motion.div>
        </div>
        <div className="p-8">
          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-2xl font-bold text-gray-900 mb-2"
          >
            Pendaftaran Berhasil!
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-gray-500 text-sm mb-6"
          >
            Tim <span className="font-bold text-orange-500">{teamName}</span>{" "}
            telah berhasil mendaftarkan{" "}
            <span className="font-bold">{slot} slot</span>!
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 text-left"
          >
            <p className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-2">
              <i className="fi fi-rr-list-check text-base" />
              Langkah Selanjutnya:
            </p>
            <ul className="text-xs text-amber-700 space-y-2.5">
              <li className="flex items-start gap-2">
                <i className="fi fi-rr-picture text-amber-500 mt-0.5" />
                Screenshot halaman ini sebagai bukti
              </li>
              <li className="flex items-start gap-2">
                <i className="fi fi-rr-coins text-amber-500 mt-0.5" />
                Lakukan pembayaran entry fee (Rp{" "}
                {slot === 1 ? "50.000" : "100.000"})
              </li>
              <li className="flex items-start gap-2">
                <i className="fi fi-brands-whatsapp text-amber-500 mt-0.5" />
                Konfirmasi ke WA 0895364711840 (Alief)
              </li>
              <li className="flex items-start gap-2">
                <i className="fi fi-rr-gamepad text-amber-500 mt-0.5" />
                Hadir tepat waktu pada hari turnamen!
              </li>
            </ul>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="bg-orange-50 border border-orange-100 rounded-xl p-4 text-left"
          >
            <p className="text-xs text-gray-400 mb-2">Info Turnamen</p>
            <p className="text-gray-800 font-bold text-sm flex items-center gap-2">
              <i className="fi fi-rr-calendar text-orange-500" /> Minggu, 9
              Agustus 2026
            </p>
            <p className="text-gray-800 font-bold text-sm flex items-center gap-2 mt-1">
              <i className="fi fi-rr-clock text-orange-500" /> 17:00 WIB
            </p>
            <p className="text-orange-500 font-bold text-sm flex items-center gap-2 mt-1">
              <i className="fi fi-rr-marker" /> Warkop Sippo Wiyung
            </p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
