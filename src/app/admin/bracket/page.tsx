export const metadata = {
  title: "Bracket – Admin Panel",
};

export default function BracketPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-gray-900">Bracket</h1>
        <p className="text-sm text-gray-500 mt-1">
          Bagan pertandingan turnamen.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="flex flex-col items-center justify-center text-center py-20 px-6">
          <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center mb-5">
            <i className="fi fi-rr-sitemap text-orange-500 text-3xl" />
          </div>
          <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
            <i className="fi fi-rr-hourglass-end text-sm" />
            Coming Soon
          </span>
          <h2 className="text-xl font-black text-gray-900 mb-2">
            Fitur Bracket Sedang Dikerjakan
          </h2>
          <p className="text-sm text-gray-500 max-w-sm">
            Bagan pertandingan turnamen masih dalam tahap pengerjaan. Nantikan
            pembaruan berikutnya!
          </p>
        </div>
      </div>
    </div>
  );
}
