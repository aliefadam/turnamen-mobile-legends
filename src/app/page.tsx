import { Toaster } from "react-hot-toast";
import HeroSection from "@/components/HeroSection";
import RegistrationForm from "@/components/RegistrationForm";
import FloatingParticles from "@/components/FloatingParticles";

export default function Home() {
  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            fontFamily: "'Plus Jakarta Sans', sans-serif",
            fontWeight: 600,
            fontSize: "14px",
            borderRadius: "12px",
            padding: "12px 16px",
          },
          success: {
            style: {
              background: "#f0fdf4",
              color: "#166534",
              border: "1px solid #bbf7d0",
            },
          },
          error: {
            style: {
              background: "#fef2f2",
              color: "#991b1b",
              border: "1px solid #fecaca",
            },
          },
        }}
      />
      <FloatingParticles />

      <main className="relative min-h-screen bg-white">
        {/* Hero */}
        <HeroSection />

        {/* Registration Form */}
        <section id="daftar" className="relative z-10 pt-12 pb-8 scroll-mt-6">
          <div className="text-center mb-8 px-4">
            <span className="inline-flex items-center gap-1.5 bg-orange-100 text-orange-700 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-3">
              <i className="fi fi-rr-edit text-sm" />
              Form Pendaftaran
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
              Daftarkan Tim Kamu
              <span className="text-orange-500"> Sekarang!</span>
            </h2>
            <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
              Isi formulir di bawah ini dengan lengkap dan benar untuk
              mendaftarkan timmu ke turnamen.
            </p>
          </div>
          <RegistrationForm />
        </section>

        {/* Footer */}
        <footer className="bg-orange-50 border-t border-orange-100 py-10 px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 mb-3">
              <i className="fi fi-rr-gamepad text-orange-500 text-2xl" />
              <h3 className="font-black text-lg text-gray-900">
                <span className="text-orange-500">Warkop Sippo</span> Tournament
              </h3>
            </div>
            <p className="text-gray-500 text-xs mb-5 flex flex-wrap items-center justify-center gap-x-2 gap-y-1">
              <span className="inline-flex items-center gap-1">
                <i className="fi fi-rr-calendar text-orange-400" /> Minggu, 9
                Agustus 2026
              </span>
              <span className="text-orange-200">•</span>
              <span className="inline-flex items-center gap-1">
                <i className="fi fi-rr-clock text-orange-400" /> 17:00 WIB
              </span>
              <span className="text-orange-200">•</span>
              <span className="inline-flex items-center gap-1">
                <i className="fi fi-rr-marker text-orange-400" /> Warkop Sippo
                Wiyung
              </span>
            </p>

            <div className="flex items-center justify-center gap-3 mb-6">
              <a
                href="https://wa.me/6289536471840"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp Alief"
                className="w-10 h-10 rounded-xl bg-white border border-orange-100 text-orange-500 hover:bg-orange-500 hover:text-white hover:border-orange-500 flex items-center justify-center transition-colors shadow-sm"
              >
                <i className="fi fi-brands-whatsapp text-lg" />
              </a>
              <a
                href="https://www.tiktok.com/@warkopsippo"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="TikTok warkopsippo"
                className="w-10 h-10 rounded-xl bg-white border border-orange-100 text-orange-500 hover:bg-orange-500 hover:text-white hover:border-orange-500 flex items-center justify-center transition-colors shadow-sm"
              >
                <i className="fi fi-brands-tik-tok text-lg" />
              </a>
              <a
                href="https://www.instagram.com/warkopsippo"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram warkopsippo"
                className="w-10 h-10 rounded-xl bg-white border border-orange-100 text-orange-500 hover:bg-orange-500 hover:text-white hover:border-orange-500 flex items-center justify-center transition-colors shadow-sm"
              >
                <i className="fi fi-brands-instagram text-lg" />
              </a>
            </div>

            <p className="text-gray-400 text-xs">
              © 2026 Warkop Sippo Wiyung. All rights reserved.
            </p>
          </div>
        </footer>
      </main>
    </>
  );
}
