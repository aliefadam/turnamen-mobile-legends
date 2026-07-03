import type { BracketMatch } from "@/db/schema";

// ---------- Types exposed to the UI ----------
export type BracketRound = {
  round: number;
  name: string;
  bestOf: number;
  matches: BracketMatch[];
};

export type BracketData = {
  exists: boolean;
  dbError: boolean;
  started: boolean;
  totalRounds: number;
  rounds: BracketRound[];
  champion: { id: number | null; name: string | null } | null;
};

// ---------- Pure helpers ----------
function nextPowerOfTwo(n: number): number {
  let p = 1;
  while (p < n) p *= 2;
  return p;
}

/** Standard bracket seed order for a given size (array of 1-based seeds). */
function seedOrder(size: number): number[] {
  let seeds = [1, 2];
  while (seeds.length < size) {
    const sum = seeds.length * 2 + 1;
    const next: number[] = [];
    for (const s of seeds) {
      next.push(s);
      next.push(sum - s);
    }
    seeds = next;
  }
  return seeds;
}

export function roundName(round: number, totalRounds: number): string {
  const fromEnd = totalRounds - round; // 0 = final
  if (fromEnd === 0) return "Final";
  if (fromEnd === 1) return "Semifinal";
  if (fromEnd === 2) return "Perempatfinal";
  const teams = Math.pow(2, fromEnd + 1);
  return `Babak ${teams} Besar`;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Entrant = {
  registrationId: number;
  displayName: string;
};

function expandBracketEntrants(
  teams: Array<{ id: number; name: string; slot: number }>
): Entrant[] {
  const entrants: Entrant[] = [];
  for (const team of teams) {
    const totalSlots = Math.max(1, Math.trunc(team.slot || 1));
    for (let i = 0; i < totalSlots; i++) {
      entrants.push({
        registrationId: team.id,
        displayName:
          totalSlots > 1 ? `${team.name} (${i + 1})` : team.name,
      });
    }
  }
  return entrants;
}

function buildSeededEntries(
  entrants: Entrant[],
  size: number,
  order: number[]
): Array<Entrant | null> {
  const pool = shuffle(entrants);
  const matches = Array.from({ length: size / 2 }, () => ({
    team1: null as Entrant | null,
    team2: null as Entrant | null,
  }));

  for (let i = 0; i < matches.length && pool.length > 0; i++) {
    matches[i].team1 = pool.shift() ?? null;
  }

  while (pool.length > 0) {
    const entrant = pool.shift()!;
    const preferred = matches.filter(
      (m) =>
        m.team2 == null &&
        m.team1 != null &&
        m.team1.registrationId !== entrant.registrationId
    );
    const fallback = matches.filter((m) => m.team2 == null);
    const bucket = preferred.length > 0 ? preferred : fallback;
    const target = bucket[Math.floor(Math.random() * bucket.length)];
    target.team2 = entrant;
  }

  const seeded: Array<Entrant | null> = Array(size).fill(null);
  for (let slot = 0; slot < matches.length; slot++) {
    const seedA = order[slot * 2] - 1;
    const seedB = order[slot * 2 + 1] - 1;
    seeded[seedA] = matches[slot].team1;
    seeded[seedB] = matches[slot].team2;
  }

  return seeded;
}

function stripSlotSuffix(name: string | null): string | null {
  if (!name) return name;
  return name.replace(/\s\(\d+\)$/, "");
}

// Minimal in-memory shape used during recompute (subset of BracketMatch, mutable).
type M = {
  id: number;
  round: number;
  slot: number;
  team1Id: number | null;
  team2Id: number | null;
  team1Name: string | null;
  team2Name: string | null;
  score1: number;
  score2: number;
  bestOf: number;
  winnerSlot: number | null;
};

function winnerOf(
  m: M,
  isFirstRound: boolean
): { id: number | null; name: string } | null {
  const p1 = m.team1Name != null;
  const p2 = m.team2Name != null;
  if (isFirstRound && p1 && !p2) return { id: m.team1Id, name: m.team1Name! };
  if (isFirstRound && p2 && !p1) return { id: m.team2Id, name: m.team2Name! };
  if (p1 && p2 && m.winnerSlot === 1) return { id: m.team1Id, name: m.team1Name! };
  if (p1 && p2 && m.winnerSlot === 2) return { id: m.team2Id, name: m.team2Name! };
  return null;
}

/**
 * Recompute the whole bracket in-memory: normalize first-round byes, then
 * propagate winners into later rounds, resetting any downstream match whose
 * incoming team changed. Mutates and returns the array.
 */
function recompute(matches: M[]): M[] {
  const maxRound = Math.max(...matches.map((m) => m.round));
  const byRound = new Map<number, M[]>();
  for (const m of matches) {
    if (!byRound.has(m.round)) byRound.set(m.round, []);
    byRound.get(m.round)!.push(m);
  }

  // Normalize first-round byes.
  for (const m of byRound.get(1) ?? []) {
    const p1 = m.team1Name != null;
    const p2 = m.team2Name != null;
    if (p1 && !p2) {
      m.winnerSlot = 1;
      m.score1 = 0;
      m.score2 = 0;
    } else if (p2 && !p1) {
      m.winnerSlot = 2;
      m.score1 = 0;
      m.score2 = 0;
    } else if (p1 && p2 && m.score1 === 0 && m.score2 === 0) {
      m.winnerSlot = null;
    }
  }

  // Propagate winners upward.
  for (let r = 1; r < maxRound; r++) {
    const parents = byRound.get(r + 1) ?? [];
    for (const m of byRound.get(r) ?? []) {
      const parent = parents.find((p) => p.slot === Math.floor(m.slot / 2));
      if (!parent) continue;
      const side = m.slot % 2 === 0 ? 1 : 2;
      const w = winnerOf(m, r === 1);
      const newId = w ? w.id : null;
      const newName = w ? w.name : null;
      const curId = side === 1 ? parent.team1Id : parent.team2Id;
      const curName = side === 1 ? parent.team1Name : parent.team2Name;
      if (curName !== newName || curId !== newId) {
        if (side === 1) {
          parent.team1Id = newId;
          parent.team1Name = newName;
        } else {
          parent.team2Id = newId;
          parent.team2Name = newName;
        }
        // Incoming team changed → invalidate this parent's result.
        parent.score1 = 0;
        parent.score2 = 0;
        parent.winnerSlot = null;
      }
    }
  }

  const finalMatch = byRound.get(maxRound)?.find((m) => m.slot === 0);
  if (
    finalMatch &&
    finalMatch.team1Id != null &&
    finalMatch.team2Id != null &&
    finalMatch.team1Id === finalMatch.team2Id
  ) {
    finalMatch.score1 = 0;
    finalMatch.score2 = 0;
    finalMatch.winnerSlot = 1;
  }

  return matches;
}

// ---------- DB access ----------
async function loadMatches(): Promise<M[]> {
  const { db } = await import("@/db");
  const { bracketMatches } = await import("@/db/schema");
  const { asc } = await import("drizzle-orm");
  const rows = await db
    .select()
    .from(bracketMatches)
    .orderBy(asc(bracketMatches.round), asc(bracketMatches.slot));
  return rows as M[];
}

async function persist(matches: M[]): Promise<void> {
  const { db } = await import("@/db");
  const { bracketMatches } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");
  for (const m of matches) {
    await db
      .update(bracketMatches)
      .set({
        team1Id: m.team1Id,
        team2Id: m.team2Id,
        team1Name: m.team1Name,
        team2Name: m.team2Name,
        score1: m.score1,
        score2: m.score2,
        bestOf: m.bestOf,
        winnerSlot: m.winnerSlot,
      })
      .where(eq(bracketMatches.id, m.id));
  }
}

// ---------- Public API ----------
export async function getBracket(): Promise<BracketData> {
  try {
    const matches = await loadMatches();
    if (matches.length === 0) {
      return { exists: false, dbError: false, started: false, totalRounds: 0, rounds: [], champion: null };
    }
    const totalRounds = Math.max(...matches.map((m) => m.round));
    const started = matches.some((m) => m.score1 > 0 || m.score2 > 0);

    const rounds: BracketRound[] = [];
    for (let r = 1; r <= totalRounds; r++) {
      const rm = matches
        .filter((m) => m.round === r)
        .sort((a, b) => a.slot - b.slot);
      rounds.push({
        round: r,
        name: roundName(r, totalRounds),
        bestOf: rm[0]?.bestOf ?? 1,
        matches: rm as BracketMatch[],
      });
    }

    const finalMatch = matches.find((m) => m.round === totalRounds && m.slot === 0);
    let champion: BracketData["champion"] = null;
    if (finalMatch?.winnerSlot === 1)
      champion = {
        id: finalMatch.team1Id,
        name:
          finalMatch.team1Id != null &&
          finalMatch.team1Id === finalMatch.team2Id
            ? stripSlotSuffix(finalMatch.team1Name)
            : finalMatch.team1Name,
      };
    else if (finalMatch?.winnerSlot === 2)
      champion = {
        id: finalMatch.team2Id,
        name:
          finalMatch.team2Id != null &&
          finalMatch.team2Id === finalMatch.team1Id
            ? stripSlotSuffix(finalMatch.team2Name)
            : finalMatch.team2Name,
      };

    return { exists: true, dbError: false, started, totalRounds, rounds, champion };
  } catch (error) {
    console.error("getBracket failed:", error);
    return { exists: false, dbError: true, started: false, totalRounds: 0, rounds: [], champion: null };
  }
}

export async function generateBracket(): Promise<{ ok: boolean; message?: string }> {
  try {
    const { db } = await import("@/db");
    const { registrations, bracketMatches } = await import("@/db/schema");
    const { eq, asc } = await import("drizzle-orm");

    const teams = await db
      .select({
        id: registrations.id,
        name: registrations.teamName,
        slot: registrations.slot,
      })
      .from(registrations)
      .where(eq(registrations.status, "confirmed"))
      .orderBy(asc(registrations.createdAt));

    const entrants = expandBracketEntrants(teams);
    const n = entrants.length;
    if (n < 2) {
      return {
        ok: false,
        message: "Butuh minimal 2 slot terkonfirmasi untuk membuat bracket.",
      };
    }

    const size = nextPowerOfTwo(n);
    const totalRounds = Math.round(Math.log2(size));
    const order = seedOrder(size); // seeds in bracket-position order

    // Expand slot=2 into two distinct bracket entrants and avoid same-team collisions
    // in the opening matchups whenever the field still allows it.
    const seedToTeam = buildSeededEntries(entrants, size, order);

    // Wipe existing bracket.
    await db.delete(bracketMatches);

    // Build round 1 rows.
    const rows: {
      round: number;
      slot: number;
      team1Id: number | null;
      team2Id: number | null;
      team1Name: string | null;
      team2Name: string | null;
    }[] = [];

    const r1Count = size / 2;
    for (let slot = 0; slot < r1Count; slot++) {
      const seedA = order[slot * 2]; // 1-based
      const seedB = order[slot * 2 + 1];
      const a = seedToTeam[seedA - 1];
      const b = seedToTeam[seedB - 1];
      rows.push({
        round: 1,
        slot,
        team1Id: a?.registrationId ?? null,
        team2Id: b?.registrationId ?? null,
        team1Name: a?.displayName ?? null,
        team2Name: b?.displayName ?? null,
      });
    }
    // Empty rows for later rounds.
    for (let r = 2; r <= totalRounds; r++) {
      const count = size / Math.pow(2, r);
      for (let slot = 0; slot < count; slot++) {
        rows.push({ round: r, slot, team1Id: null, team2Id: null, team1Name: null, team2Name: null });
      }
    }

    await db.insert(bracketMatches).values(rows.map((r) => ({ ...r, bestOf: 1 })));

    // Resolve byes → fill round 2, then persist.
    const matches = await loadMatches();
    recompute(matches);
    await persist(matches);

    return { ok: true };
  } catch (error) {
    console.error("generateBracket failed:", error);
    return { ok: false, message: "Gagal membuat bracket." };
  }
}

export async function resetBracket(): Promise<{ ok: boolean }> {
  try {
    const { db } = await import("@/db");
    const { bracketMatches } = await import("@/db/schema");
    await db.delete(bracketMatches);
    return { ok: true };
  } catch (error) {
    console.error("resetBracket failed:", error);
    return { ok: false };
  }
}

export async function setMatchResult(
  matchId: number,
  score1: number,
  score2: number
): Promise<{ ok: boolean; message?: string }> {
  try {
    const matches = await loadMatches();
    const m = matches.find((x) => x.id === matchId);
    if (!m) return { ok: false, message: "Match tidak ditemukan." };
    if (m.team1Name == null || m.team2Name == null)
      return { ok: false, message: "Kedua tim belum lengkap." };

    const need = Math.ceil(m.bestOf / 2);
    const s1 = Math.trunc(score1);
    const s2 = Math.trunc(score2);
    if (s1 < 0 || s2 < 0 || s1 > need || s2 > need)
      return { ok: false, message: `Skor tidak valid untuk BO${m.bestOf}.` };

    m.score1 = s1;
    m.score2 = s2;
    if (s1 === need && s2 < need) m.winnerSlot = 1;
    else if (s2 === need && s1 < need) m.winnerSlot = 2;
    else m.winnerSlot = null;

    recompute(matches);
    await persist(matches);
    return { ok: true };
  } catch (error) {
    console.error("setMatchResult failed:", error);
    return { ok: false, message: "Gagal menyimpan hasil." };
  }
}

export async function setRoundBestOf(
  round: number,
  bestOf: number
): Promise<{ ok: boolean; message?: string }> {
  if (![1, 3, 5, 7].includes(bestOf))
    return { ok: false, message: "Best-of tidak valid." };
  try {
    const matches = await loadMatches();
    const need = Math.ceil(bestOf / 2);
    for (const m of matches) {
      if (m.round !== round) continue;
      m.bestOf = bestOf;
      const scoresExist = m.score1 > 0 || m.score2 > 0;
      if (!scoresExist) continue;

      const isValidScore =
        m.score1 >= 0 &&
        m.score2 >= 0 &&
        m.score1 <= need &&
        m.score2 <= need &&
        !(m.score1 === need && m.score2 === need);

      if (!isValidScore) {
        m.score1 = 0;
        m.score2 = 0;
        m.winnerSlot = null;
        continue;
      }

      if (m.score1 === need && m.score2 < need) m.winnerSlot = 1;
      else if (m.score2 === need && m.score1 < need) m.winnerSlot = 2;
      else m.winnerSlot = null;
    }
    recompute(matches);
    await persist(matches);
    return { ok: true };
  } catch (error) {
    console.error("setRoundBestOf failed:", error);
    return { ok: false, message: "Gagal mengubah best-of." };
  }
}

export async function swapTeams(
  matchAId: number,
  sideA: 1 | 2,
  matchBId: number,
  sideB: 1 | 2
): Promise<{ ok: boolean; message?: string }> {
  try {
    const matches = await loadMatches();
    const started = matches.some((m) => m.score1 > 0 || m.score2 > 0);
    if (started)
      return { ok: false, message: "Tidak bisa mengatur posisi setelah pertandingan dimulai." };

    const a = matches.find((m) => m.id === matchAId);
    const b = matches.find((m) => m.id === matchBId);
    if (!a || !b || a.round !== 1 || b.round !== 1)
      return { ok: false, message: "Hanya bisa menukar tim pada ronde pertama." };

    const getTeam = (m: M, side: 1 | 2) =>
      side === 1
        ? { id: m.team1Id, name: m.team1Name }
        : { id: m.team2Id, name: m.team2Name };
    const setTeam = (m: M, side: 1 | 2, t: { id: number | null; name: string | null }) => {
      if (side === 1) {
        m.team1Id = t.id;
        m.team1Name = t.name;
      } else {
        m.team2Id = t.id;
        m.team2Name = t.name;
      }
    };

    const ta = getTeam(a, sideA);
    const tb = getTeam(b, sideB);
    setTeam(a, sideA, tb);
    setTeam(b, sideB, ta);

    recompute(matches);
    await persist(matches);
    return { ok: true };
  } catch (error) {
    console.error("swapTeams failed:", error);
    return { ok: false, message: "Gagal menukar posisi tim." };
  }
}
