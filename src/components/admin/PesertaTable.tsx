"use client";

import { useMemo, useState } from "react";
import type { Registration } from "@/db/schema";

function formatDate(d: Date | string) {
  return new Date(d).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

type Player = { name: string | null; mlId: string | null; server: string | null };

function mainPlayers(r: Registration): Player[] {
  return [
    { name: r.player1Name, mlId: r.player1MlId, server: r.player1Server },
    { name: r.player2Name, mlId: r.player2MlId, server: r.player2Server },
    { name: r.player3Name, mlId: r.player3MlId, server: r.player3Server },
    { name: r.player4Name, mlId: r.player4MlId, server: r.player4Server },
    { name: r.player5Name, mlId: r.player5MlId, server: r.player5Server },
  ];
}

function substitutes(r: Registration): Player[] {
  return [
    { name: r.sub1Name, mlId: r.sub1MlId, server: r.sub1Server },
    { name: r.sub2Name, mlId: r.sub2MlId, server: r.sub2Server },
  ].filter((p) => p.name);
}

export default function PesertaTable({ data }: { data: Registration[] }) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data;
    return data.filter(
      (r) =>
        r.teamName.toLowerCase().includes(q) ||
        r.leaderName.toLowerCase().includes(q) ||
        r.leaderWhatsapp.toLowerCase().includes(q)
    );
  }, [data, query]);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 px-5 py-4 border-b border-gray-100">
        <h2 className="font-bold text-gray-900 flex items-center gap-2">
          <i className="fi fi-rr-users text-orange-500" />
          Daftar Peserta
          <span className="text-xs font-semibold text-gray-400">
            ({filtered.length})
          </span>
        </h2>
        <div className="relative sm:ml-auto sm:w-72">
          <i className="fi fi-rr-search absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Cari tim, ketua, atau WhatsApp..."
            className="input-field w-full pl-10 pr-4 py-2.5 rounded-xl bg-gray-50 text-gray-800 placeholder-gray-400 text-sm"
          />
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="p-12 text-center">
          <div className="w-14 h-14 rounded-2xl bg-gray-50 mx-auto flex items-center justify-center mb-3">
            <i className="fi fi-rr-inbox text-gray-300 text-2xl" />
          </div>
          <p className="text-sm text-gray-400">
            {data.length === 0 ? "Belum ada peserta terdaftar." : "Tidak ada hasil yang cocok."}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs font-semibold uppercase tracking-wider text-gray-400 border-b border-gray-100">
                <th className="px-5 py-3 w-10">#</th>
                <th className="px-5 py-3">Nama Tim</th>
                <th className="px-5 py-3">Ketua</th>
                <th className="px-5 py-3">WhatsApp</th>
                <th className="px-5 py-3 text-center">Slot</th>
                <th className="px-5 py-3 hidden md:table-cell">Terdaftar</th>
                <th className="px-5 py-3 text-right">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((r, i) => {
                const isOpen = expanded === r.id;
                const subs = substitutes(r);
                return (
                  <FragmentRow
                    key={r.id}
                    index={i}
                    r={r}
                    isOpen={isOpen}
                    onToggle={() => setExpanded(isOpen ? null : r.id)}
                    subs={subs}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function FragmentRow({
  index,
  r,
  isOpen,
  onToggle,
  subs,
}: {
  index: number;
  r: Registration;
  isOpen: boolean;
  onToggle: () => void;
  subs: Player[];
}) {
  return (
    <>
      <tr className="hover:bg-gray-50/60 transition-colors">
        <td className="px-5 py-3.5 text-gray-400 font-medium">{index + 1}</td>
        <td className="px-5 py-3.5">
          <span className="font-semibold text-gray-800">{r.teamName}</span>
        </td>
        <td className="px-5 py-3.5 text-gray-600">{r.leaderName}</td>
        <td className="px-5 py-3.5">
          <a
            href={`https://wa.me/${r.leaderWhatsapp.replace(/[^0-9]/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-600 hover:text-green-600 inline-flex items-center gap-1.5"
          >
            <i className="fi fi-brands-whatsapp text-green-500" />
            {r.leaderWhatsapp}
          </a>
        </td>
        <td className="px-5 py-3.5 text-center">
          <span className="inline-flex items-center justify-center min-w-[1.75rem] px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 font-bold text-xs">
            {r.slot}
          </span>
        </td>
        <td className="px-5 py-3.5 text-gray-400 text-xs hidden md:table-cell">
          {formatDate(r.createdAt)}
        </td>
        <td className="px-5 py-3.5 text-right">
          <button
            onClick={onToggle}
            className="inline-flex items-center gap-1 text-xs font-semibold text-orange-600 hover:text-orange-700"
          >
            {isOpen ? "Tutup" : "Lihat"}
            <i className={`fi fi-rr-angle-small-down transition-transform ${isOpen ? "rotate-180" : ""}`} />
          </button>
        </td>
      </tr>
      {isOpen && (
        <tr className="bg-orange-50/40">
          <td colSpan={7} className="px-5 py-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <PlayerList title="Pemain Inti" icon="fi-rr-sword" players={mainPlayers(r)} captainFirst />
              {subs.length > 0 && (
                <PlayerList title="Pemain Cadangan" icon="fi-rr-refresh" players={subs} />
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

function PlayerList({
  title,
  icon,
  players,
  captainFirst,
}: {
  title: string;
  icon: string;
  players: Player[];
  captainFirst?: boolean;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
        <i className={`fi ${icon} text-orange-500 text-sm`} />
        <h4 className="font-bold text-xs text-gray-700">{title}</h4>
      </div>
      <ul className="divide-y divide-gray-50">
        {players.map((p, i) => (
          <li key={i} className="flex items-center gap-3 px-4 py-2.5">
            <span className="w-6 h-6 rounded-full bg-orange-50 text-orange-500 flex items-center justify-center text-[11px] font-bold flex-shrink-0">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-gray-800 truncate">
                {p.name || "-"}
                {captainFirst && i === 0 && (
                  <span className="ml-1.5 text-[10px] font-bold text-orange-500 uppercase">
                    Captain
                  </span>
                )}
              </p>
              <p className="text-xs text-gray-400">
                ID: {p.mlId || "-"} • Server: {p.server || "-"}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
