"use client";

import { useCallback, useLayoutEffect, useRef, useState } from "react";
import type { BracketMatch } from "@/db/schema";
import type { BracketRound } from "@/lib/bracket";

export default function BracketBoard({
  rounds,
  totalRounds,
  champion,
  mode = "view",
  onEditMatch,
  onTogglePlayed,
  busyAction,
  onDragStartTeam,
  onDropTeam,
  onChangeBestOf,
}: {
  rounds: BracketRound[];
  totalRounds: number;
  champion: { id: number | null; name: string | null } | null;
  mode?: "view" | "edit" | "arrange";
  onEditMatch?: (m: BracketMatch) => void;
  onTogglePlayed?: (matchId: number, played: boolean) => void;
  busyAction?: string | null;
  onDragStartTeam?: (matchId: number, side: 1 | 2) => void;
  onDropTeam?: (matchId: number, side: 1 | 2) => void;
  onChangeBestOf?: (round: number, bestOf: number) => void;
}) {
  // Local drag visuals (which chip is being dragged / hovered).
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [overKey, setOverKey] = useState<string | null>(null);

  // Connector lines (tree) drawn behind the cards.
  const containerRef = useRef<HTMLDivElement>(null);
  const championBodyRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Map<string, HTMLElement>>(new Map());
  const [segments, setSegments] = useState<string[]>([]);
  const [dims, setDims] = useState<{ w: number; h: number }>({ w: 0, h: 0 });
  const [championTop, setChampionTop] = useState<number | null>(null);

  const registerNode = useCallback((key: string, el: HTMLElement | null) => {
    if (el) nodeRefs.current.set(key, el);
    else nodeRefs.current.delete(key);
  }, []);

  useLayoutEffect(() => {
    const compute = () => {
      const container = containerRef.current;
      if (!container) return;
      const c = container.getBoundingClientRect();
      const rectOf = (k: string) => nodeRefs.current.get(k)?.getBoundingClientRect();
      const segs: string[] = [];
      const connect = (childKey: string, parentKey: string) => {
        const cr = rectOf(childKey);
        const pr = rectOf(parentKey);
        if (!cr || !pr) return;
        const x1 = cr.right - c.left;
        const y1 = cr.top + cr.height / 2 - c.top;
        const x2 = pr.left - c.left;
        const y2 = pr.top + pr.height / 2 - c.top;
        const midX = x1 + (x2 - x1) / 2;
        segs.push(`M ${x1} ${y1} H ${midX} V ${y2} H ${x2}`);
      };
      for (let r = 1; r < totalRounds; r++) {
        const rd = rounds.find((x) => x.round === r);
        rd?.matches.forEach((m) =>
          connect(`${r}-${m.slot}`, `${r + 1}-${Math.floor(m.slot / 2)}`)
        );
      }
      if (totalRounds >= 1) connect(`${totalRounds}-0`, "champion");

      const finalRect = rectOf(`${totalRounds}-0`);
      const championRect = rectOf("champion");
      const championBodyRect = championBodyRef.current?.getBoundingClientRect();
      if (finalRect && championRect && championBodyRect) {
        const top =
          finalRect.top +
          finalRect.height / 2 -
          championBodyRect.top -
          championRect.height / 2;
        const maxTop = Math.max(0, championBodyRect.height - championRect.height);
        setChampionTop(Math.min(Math.max(0, top), maxTop));
      } else {
        setChampionTop(null);
      }

      setSegments(segs);
      setDims({ w: container.offsetWidth, h: container.offsetHeight });
    };

    compute();
    const ro = new ResizeObserver(compute);
    if (containerRef.current) ro.observe(containerRef.current);
    window.addEventListener("resize", compute);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", compute);
    };
  }, [rounds, totalRounds]);

  return (
    <div className="bracket-scroll overflow-x-auto pb-2">
      <div
        ref={containerRef}
        className="relative flex gap-10 min-w-max items-stretch"
      >
        {/* Connector lines (behind cards) */}
        <svg
          width={dims.w}
          height={dims.h}
          className="absolute top-0 left-0 pointer-events-none"
          style={{ zIndex: 0 }}
        >
          {segments.map((d, i) => (
            <path
              key={i}
              d={d}
              fill="none"
              stroke="#d1d5db"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ))}
        </svg>

        {rounds.map((r) => (
          <div key={r.round} className="relative z-10 flex flex-col min-w-[230px]">
            {/* Round header */}
            <div className="flex items-center justify-between gap-2 px-1 mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                {r.name}
              </span>
              {mode === "edit" && onChangeBestOf ? (
                <select
                  value={r.bestOf}
                  onChange={(e) => onChangeBestOf(r.round, Number(e.target.value))}
                  className="text-[11px] font-bold text-orange-600 bg-orange-50 border border-orange-200 rounded-lg px-2 py-1 cursor-pointer"
                  title="Ubah Best-of ronde ini"
                >
                  {[1, 3, 5, 7].map((b) => (
                    <option key={b} value={b}>
                      BO{b}
                    </option>
                  ))}
                </select>
              ) : (
                <span className="text-[11px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">
                  BO{r.bestOf}
                </span>
              )}
            </div>

            {/* Matches */}
            <div className="flex flex-col justify-around gap-4 flex-1">
              {r.matches.map((m) => (
                <MatchCard
                  key={m.id}
                  match={m}
                  isFirstRound={r.round === 1}
                  mode={mode}
                  dragKey={dragKey}
                  overKey={overKey}
                  setDragKey={setDragKey}
                  setOverKey={setOverKey}
                  onEditMatch={onEditMatch}
                  onTogglePlayed={onTogglePlayed}
                  busyAction={busyAction}
                  onDragStartTeam={onDragStartTeam}
                  onDropTeam={onDropTeam}
                  registerNode={registerNode}
                />
              ))}
            </div>
          </div>
        ))}

        {/* Champion column */}
        <div className="relative z-10 flex flex-col min-w-[190px]">
          <div className="flex items-center justify-between gap-2 px-1 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-transparent select-none">
              BO
            </span>
            <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
              Juara
            </span>
          </div>
          <div ref={championBodyRef} className="relative flex-1">
            <div
              className={`absolute inset-x-0 flex justify-center ${
                championTop == null ? "top-1/2 -translate-y-1/2" : ""
              }`}
              style={championTop == null ? undefined : { top: `${championTop}px` }}
            >
              <div
                ref={(el) => registerNode("champion", el)}
                className={`rounded-2xl p-4 text-center border-2 min-w-[160px] ${
                  champion?.name
                    ? "border-amber-300 bg-gradient-to-br from-amber-50 to-orange-50"
                    : "border-dashed border-gray-200 bg-gray-50"
                }`}
              >
                <i
                  className={`fi fi-rr-trophy text-3xl ${
                    champion?.name ? "text-amber-500" : "text-gray-300"
                  }`}
                />
                <p
                  className={`mt-2 font-black ${
                    champion?.name ? "text-gray-900" : "text-gray-400 text-sm font-medium"
                  }`}
                >
                  {champion?.name ?? "Belum ada juara"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MatchCard({
  match,
  isFirstRound,
  mode,
  dragKey,
  overKey,
  setDragKey,
  setOverKey,
  onEditMatch,
  onTogglePlayed,
  busyAction,
  onDragStartTeam,
  onDropTeam,
  registerNode,
}: {
  match: BracketMatch;
  isFirstRound: boolean;
  mode: "view" | "edit" | "arrange";
  dragKey: string | null;
  overKey: string | null;
  setDragKey: (k: string | null) => void;
  setOverKey: (k: string | null) => void;
  onEditMatch?: (m: BracketMatch) => void;
  onTogglePlayed?: (matchId: number, played: boolean) => void;
  busyAction?: string | null;
  onDragStartTeam?: (matchId: number, side: 1 | 2) => void;
  onDropTeam?: (matchId: number, side: 1 | 2) => void;
  registerNode: (key: string, el: HTMLElement | null) => void;
}) {
  const p1 = match.team1Name != null;
  const p2 = match.team2Name != null;
  const bothPresent = p1 && p2;
  const isBye = isFirstRound && p1 !== p2;
  const matchPlayed = match.played === true;
  const matchDone = matchPlayed && match.winnerSlot != null;
  const matchLive = matchPlayed && match.winnerSlot == null;
  const canEdit = mode === "edit" && bothPresent && matchPlayed;
  const arrange = mode === "arrange";
  const canTogglePlayed = mode === "edit" && bothPresent;
  const matchBusy = busyAction === `played:${match.id}`;
  const statusTone = bothPresent
    ? matchDone
      ? "border-emerald-200 bg-emerald-50/70"
      : matchLive
        ? "border-sky-200 bg-sky-50/70"
        : "border-amber-200 bg-amber-50/70"
    : "border-gray-200 bg-white";

  return (
    <div
      ref={(el) => registerNode(`${match.round}-${match.slot}`, el)}
      className={`relative rounded-xl border shadow-sm overflow-hidden transition-colors ${statusTone}`}
    >
      {mode === "view" && (matchDone || matchLive) && (
        <MatchStatusRibbon
          busy={matchBusy}
          isDone={matchDone}
          isLive={matchLive}
        />
      )}
      <div>
        <TeamRow
          side={1}
          name={match.team1Name}
          score={match.score1}
          isWinner={match.winnerSlot === 1}
          showScore={bothPresent}
          isByePlaceholder={isFirstRound && !p1}
          match={match}
          arrange={arrange}
          dragKey={dragKey}
          overKey={overKey}
          setDragKey={setDragKey}
          setOverKey={setOverKey}
          onDragStartTeam={onDragStartTeam}
          onDropTeam={onDropTeam}
        />
        <div className="h-px bg-gray-100" />
        <TeamRow
          side={2}
          name={match.team2Name}
          score={match.score2}
          isWinner={match.winnerSlot === 2}
          showScore={bothPresent}
          isByePlaceholder={isFirstRound && !p2}
          match={match}
          arrange={arrange}
          dragKey={dragKey}
          overKey={overKey}
          setDragKey={setDragKey}
          setOverKey={setOverKey}
          onDragStartTeam={onDragStartTeam}
          onDropTeam={onDropTeam}
        />
      </div>

      {isBye && (
        <span className="absolute top-1.5 right-1.5 text-[9px] font-bold text-green-600 bg-green-50 px-1.5 py-0.5 rounded">
          BYE
        </span>
      )}

      {(canTogglePlayed || canEdit) && (
        <div className="px-3 pb-3 pt-2 border-t border-white/70">
          <div className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
            <div className="min-w-0">
              {(matchDone || matchLive) && (
                <MatchStatusPill
                  busy={matchBusy}
                  isDone={matchDone}
                  isLive={matchLive}
                />
              )}
            </div>
            <div className="flex justify-center">
              {canEdit && (
                <button
                  onClick={() => onEditMatch?.(match)}
                  title="Input / ubah skor"
                  className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500 px-3 py-1.5 text-[11px] font-bold text-white transition-colors hover:bg-orange-600"
                >
                  <i className="fi fi-rr-pencil text-xs" />
                  Input Skor
                </button>
              )}
            </div>
            {canTogglePlayed && (
              <button
                onClick={() => onTogglePlayed?.(match.id, !matchPlayed)}
                disabled={matchBusy}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-colors disabled:opacity-60 ${
                  matchPlayed
                    ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    : "bg-amber-500 text-white hover:bg-amber-600"
                }`}
              >
                {matchBusy ? (
                  <>
                    <Spinner className="h-3.5 w-3.5" />
                    Memproses...
                  </>
                ) : matchPlayed ? (
                  <>
                    <i className="fi fi-rr-rotate-left" />
                    Batalkan
                  </>
                ) : (
                  <>
                    <i className="fi fi-rr-play-alt" />
                    Tandai Bermain
                  </>
                )}
              </button>
            )}
          </div>
          {canTogglePlayed && !matchPlayed && (
            <p className="mt-2 text-[11px] text-amber-700/90">
              Input skor baru aktif setelah pertandingan ini ditandai sudah bermain.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

function MatchStatusRibbon({
  busy,
  isDone,
  isLive,
}: {
  busy: boolean;
  isDone: boolean;
  isLive: boolean;
}) {
  const tone = isDone
    ? "bg-emerald-500/95 text-white shadow-emerald-200"
    : "bg-sky-500/95 text-white shadow-sky-200";
  const icon = isDone
    ? "fi-rr-badge-check"
    : "fi-rr-signal-stream";
  const label = isDone ? "Sudah bermain" : "Sedang bermain";

  return (
    <div className="pointer-events-none absolute inset-x-0 top-1/2 z-20 flex -translate-y-1/2 justify-center px-3">
      <MatchStatusContent
        busy={busy}
        icon={icon}
        label={label}
        tone={tone}
        isLive={isLive}
        size="ribbon"
      />
    </div>
  );
}

function MatchStatusPill({
  busy,
  isDone,
  isLive,
}: {
  busy: boolean;
  isDone: boolean;
  isLive: boolean;
}) {
  const tone = isDone
    ? "bg-emerald-100 text-emerald-700"
    : "bg-sky-100 text-sky-700";
  const icon = isDone ? "fi-rr-badge-check" : "fi-rr-signal-stream";
  const label = isDone ? "Sudah bermain" : "Sedang bermain";

  return (
    <MatchStatusContent
      busy={busy}
      icon={icon}
      label={label}
      tone={tone}
      isLive={isLive}
      size="pill"
    />
  );
}

function MatchStatusContent({
  busy,
  icon,
  label,
  tone,
  isLive,
  size,
}: {
  busy: boolean;
  icon: string;
  label: string;
  tone: string;
  isLive: boolean;
  size: "ribbon" | "pill";
}) {
  const baseClass =
    size === "ribbon"
      ? "inline-flex items-center justify-center gap-1 rounded-full px-2.5 py-0.5 text-[8px] font-black uppercase tracking-[0.08em] shadow-md"
      : "inline-flex items-center justify-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold";
  const iconClass =
    size === "ribbon"
      ? `h-2.5 w-2.5 ${isLive ? "animate-pulse" : ""}`
      : `h-3.5 w-3.5 ${isLive ? "animate-pulse" : ""}`;

  return (
    <span className={`${baseClass} ${tone}`}>
      {busy ? (
        <Spinner className={`${iconClass} ${size === "ribbon" ? "text-white" : "text-current"}`} />
      ) : (
        <i className={`fi ${icon} ${isLive ? "animate-pulse" : ""}`} />
      )}
      {label}
    </span>
  );
}

function Spinner({ className = "h-4 w-4 text-current" }: { className?: string }) {
  return (
    <svg className={`animate-spin ${className}`} viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

function TeamRow({
  side,
  name,
  score,
  isWinner,
  showScore,
  isByePlaceholder,
  match,
  arrange,
  dragKey,
  overKey,
  setDragKey,
  setOverKey,
  onDragStartTeam,
  onDropTeam,
}: {
  side: 1 | 2;
  name: string | null;
  score: number;
  isWinner: boolean;
  showScore: boolean;
  isByePlaceholder: boolean;
  match: BracketMatch;
  arrange: boolean;
  dragKey: string | null;
  overKey: string | null;
  setDragKey: (k: string | null) => void;
  setOverKey: (k: string | null) => void;
  onDragStartTeam?: (matchId: number, side: 1 | 2) => void;
  onDropTeam?: (matchId: number, side: 1 | 2) => void;
}) {
  const empty = name == null;
  const label = empty ? "—" : name;
  const key = `${match.id}-${side}`;
  const isDragging = dragKey === key;
  const isOver = overKey === key && dragKey != null && dragKey !== key;

  const content = (
    <>
      {arrange && !empty && (
        <i className="fi fi-rr-grip-dots text-gray-300 mr-1.5 flex-shrink-0" />
      )}
      <span
        className={`text-sm truncate ${
          isWinner
            ? "font-bold text-gray-900"
            : empty
              ? "text-gray-300 italic"
              : "text-gray-600"
        }`}
      >
        {label}
      </span>
      {showScore ? (
        <span
          className={`ml-auto pl-2 text-sm font-black tabular-nums flex-shrink-0 ${
            isWinner ? "text-orange-600" : "text-gray-400"
          }`}
        >
          {score}
        </span>
      ) : (
        isWinner && (
          <i className="fi fi-rr-check text-green-500 text-xs flex-shrink-0 ml-auto" />
        )
      )}
    </>
  );

  const base = `flex items-center px-3 py-2.5 ${isWinner ? "bg-orange-50/60" : ""}`;

  if (arrange) {
    return (
      <div
        draggable={!empty}
        onDragStart={(e) => {
          if (empty) return;
          setDragKey(key);
          onDragStartTeam?.(match.id, side);
          e.dataTransfer.effectAllowed = "move";
        }}
        onDragEnd={() => {
          setDragKey(null);
          setOverKey(null);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragEnter={() => setOverKey(key)}
        onDragLeave={() => setOverKey(overKey === key ? null : overKey)}
        onDrop={(e) => {
          e.preventDefault();
          onDropTeam?.(match.id, side);
          setOverKey(null);
        }}
        className={`${base} transition-all ${!empty ? "cursor-grab active:cursor-grabbing" : ""} ${
          isDragging ? "opacity-40" : ""
        } ${isOver ? "ring-2 ring-blue-400 ring-inset bg-blue-50" : ""}`}
      >
        {content}
      </div>
    );
  }

  return <div className={base}>{content}</div>;
}
