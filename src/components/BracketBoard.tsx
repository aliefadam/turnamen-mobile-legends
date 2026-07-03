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
  onDragStartTeam,
  onDropTeam,
  onChangeBestOf,
}: {
  rounds: BracketRound[];
  totalRounds: number;
  champion: { id: number | null; name: string | null } | null;
  mode?: "view" | "edit" | "arrange";
  onEditMatch?: (m: BracketMatch) => void;
  onDragStartTeam?: (matchId: number, side: 1 | 2) => void;
  onDropTeam?: (matchId: number, side: 1 | 2) => void;
  onChangeBestOf?: (round: number, bestOf: number) => void;
}) {
  // Local drag visuals (which chip is being dragged / hovered).
  const [dragKey, setDragKey] = useState<string | null>(null);
  const [overKey, setOverKey] = useState<string | null>(null);

  // Connector lines (tree) drawn behind the cards.
  const containerRef = useRef<HTMLDivElement>(null);
  const nodeRefs = useRef<Map<string, HTMLElement>>(new Map());
  const [segments, setSegments] = useState<string[]>([]);
  const [dims, setDims] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

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
          <div className="px-1 mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-500">
              Juara
            </span>
          </div>
          <div className="flex-1 flex flex-col justify-center">
            <div
              ref={(el) => registerNode("champion", el)}
              className={`rounded-2xl p-4 text-center border-2 ${
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
  onDragStartTeam?: (matchId: number, side: 1 | 2) => void;
  onDropTeam?: (matchId: number, side: 1 | 2) => void;
  registerNode: (key: string, el: HTMLElement | null) => void;
}) {
  const p1 = match.team1Name != null;
  const p2 = match.team2Name != null;
  const bothPresent = p1 && p2;
  const isBye = isFirstRound && p1 !== p2;
  const canEdit = mode === "edit" && bothPresent;
  const arrange = mode === "arrange" && isFirstRound;

  return (
    <div
      ref={(el) => registerNode(`${match.round}-${match.slot}`, el)}
      className="relative rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden"
    >
      <div className={canEdit ? "pr-10" : ""}>
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

      {canEdit && (
        <button
          onClick={() => onEditMatch?.(match)}
          title="Input / ubah skor"
          className="absolute inset-y-0 right-0 w-10 bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center transition-colors"
        >
          <i className="fi fi-rr-pencil text-sm" />
        </button>
      )}
    </div>
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
