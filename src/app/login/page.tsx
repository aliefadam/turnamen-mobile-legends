"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import AppToaster from "@/components/AppToaster";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/admin";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (json.success) {
        toast.success("Login berhasil");
        router.replace(from);
        router.refresh();
      } else {
        toast.error(json.message || "Login gagal");
      }
    } catch {
      toast.error("Gagal terhubung ke server");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="w-full max-w-md"
    >
      <div className="bg-white rounded-3xl shadow-xl border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-400 to-orange-500 p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-white/20 mx-auto flex items-center justify-center mb-3">
            <i className="fi fi-rr-lock text-white text-2xl" />
          </div>
          <h1 className="text-xl font-black text-white">Admin Panel</h1>
          <p className="text-white/80 text-sm mt-1">Warkop Sippo Tournament</p>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="p-8 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Email
            </label>
            <div className="relative">
              <i className="fi fi-rr-envelope absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                autoComplete="username"
                required
                className="input-field w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 text-gray-800 placeholder-gray-400 text-sm font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              Password
            </label>
            <div className="relative">
              <i className="fi fi-rr-key absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                autoComplete="current-password"
                required
                className="input-field w-full pl-11 pr-11 py-3 rounded-xl bg-gray-50 text-gray-800 placeholder-gray-400 text-sm font-medium"
              />
              <button
                type="button"
                onClick={() => setShowPassword((s) => !s)}
                aria-label={
                  showPassword ? "Sembunyikan password" : "Tampilkan password"
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-500 transition-colors"
              >
                <i
                  className={`fi ${showPassword ? "fi-rr-eye-crossed" : "fi-rr-eye"}`}
                />
              </button>
            </div>
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            whileHover={!loading ? { scale: 1.02 } : {}}
            whileTap={!loading ? { scale: 0.97 } : {}}
            className="w-full px-6 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 text-white font-bold text-sm shadow-md shadow-orange-200 disabled:opacity-60 disabled:cursor-not-allowed btn-press flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg
                  className="animate-spin h-4 w-4"
                  viewBox="0 0 24 24"
                  fill="none"
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
                Memproses...
              </>
            ) : (
              <>
                <i className="fi fi-rr-sign-in-alt" />
                Masuk
              </>
            )}
          </motion.button>
        </form>
      </div>

      <p className="text-center text-gray-400 text-xs mt-6">
        © 2026 Warkop Sippo Wiyung
      </p>
    </motion.div>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-orange-50 via-amber-50/60 to-white flex items-center justify-center px-4 py-12">
      <AppToaster />
      <Suspense fallback={<div className="text-gray-400 text-sm">Memuat…</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
