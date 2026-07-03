export default function SiteFooter() {
  return (
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
            <i className="fi fi-rr-calendar text-orange-400" /> Minggu, 9 Agustus
            2026
          </span>
          <span className="text-orange-200">•</span>
          <span className="inline-flex items-center gap-1">
            <i className="fi fi-rr-clock text-orange-400" /> 17:00 WIB
          </span>
          <span className="text-orange-200">•</span>
          <span className="inline-flex items-center gap-1">
            <i className="fi fi-rr-marker text-orange-400" /> Warkop Sippo Wiyung
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
  );
}
