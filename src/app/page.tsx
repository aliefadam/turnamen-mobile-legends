import AppToaster from "@/components/AppToaster";
import HeroSection from "@/components/HeroSection";
import RegistrationForm from "@/components/RegistrationForm";
import SiteFooter from "@/components/SiteFooter";
import FloatingParticles from "@/components/FloatingParticles";

export default function Home() {
  return (
    <>
      <AppToaster />
      <FloatingParticles />

      <main className="relative min-h-screen bg-white flex flex-col">
        <HeroSection />

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
          <RegistrationForm />
        </section>

        <SiteFooter />
      </main>
    </>
  );
}
