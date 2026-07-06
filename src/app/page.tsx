import AppToaster from "@/components/AppToaster";
import HeroSection from "@/components/HeroSection";
import RegistrationForm from "@/components/RegistrationForm";
import SiteFooter from "@/components/SiteFooter";
import FloatingParticles from "@/components/FloatingParticles";
import RundownRulesModal from "@/components/RundownRulesModal";
import { getActiveSeason } from "@/lib/seasons";

export default async function Home() {
  const season = await getActiveSeason();

  return (
    <>
      <AppToaster />
      <FloatingParticles />

      <main className="relative min-h-screen bg-white flex flex-col">
        <HeroSection seasonName={season?.name ?? null} registrationOpen={season?.registrationOpen ?? false} />

        {/* Sistem Pertandingan */}
        <section className="relative z-10 pt-10 px-4">
          <div className="text-center mb-6">
            <span className="inline-flex items-center gap-1.5 bg-orange-100 text-orange-700 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-3">
              <i className="fi fi-rr-sword text-sm" />
              Sistem Pertandingan
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900">
              Format <span className="text-orange-500">Turnamen</span>
            </h2>
            <p className="text-gray-500 text-sm mt-2 max-w-md mx-auto">
              Turnamen menggunakan sistem gugur (single elimination).
            </p>
          </div>

          <div className="max-w-lg mx-auto grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center flex-shrink-0">
                <i className="fi fi-rr-sword text-orange-500 text-xl" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Penyisihan
                </p>
                <p className="text-lg font-black text-gray-900">
                  Best of 1 <span className="text-orange-500">(BO1)</span>
                </p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-50 to-orange-50 flex items-center justify-center flex-shrink-0">
                <i className="fi fi-rr-trophy text-orange-500 text-xl" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                  Semifinal &amp; Final
                </p>
                <p className="text-lg font-black text-gray-900">
                  Best of 3 <span className="text-orange-500">(BO3)</span>
                </p>
              </div>
            </div>
          </div>

          <RundownRulesModal />
        </section>

        {/* Registration Form */}
        <section id="daftar" className="relative z-10 pt-12 pb-8 scroll-mt-6 flex-1">
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
          <RegistrationForm
            seasonName={season?.name ?? null}
            registrationOpen={season?.registrationOpen ?? false}
          />
        </section>

        <SiteFooter />
      </main>
    </>
  );
}
