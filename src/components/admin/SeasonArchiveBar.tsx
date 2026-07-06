import Link from "next/link";
import type { Season } from "@/db/schema";

export default function SeasonArchiveBar({
  seasons,
  selectedSlug,
  activeSlug,
  basePath,
}: {
  seasons: Season[];
  selectedSlug: string | null;
  activeSlug: string | null;
  basePath: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-400 mr-1">
          Season
        </span>
        {seasons.map((season) => {
          const selected = season.slug === selectedSlug;
          const active = season.slug === activeSlug;
          return (
            <Link
              key={season.id}
              href={`${basePath}?season=${encodeURIComponent(season.slug)}`}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-semibold transition-colors ${
                selected
                  ? "bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-md shadow-orange-200"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              <i className={`fi ${active ? "fi-rr-badge-check" : "fi-rr-layers"}`} />
              {season.name}
              {active && (
                <span className={`text-[10px] font-bold uppercase ${selected ? "text-white/90" : "text-green-600"}`}>
                  Aktif
                </span>
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
