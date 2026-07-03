import { NextRequest, NextResponse } from "next/server";
import { getAdminInfo } from "@/lib/admin-session";
import {
  generateBracket,
  resetBracket,
  setMatchResult,
  setRoundBestOf,
  swapTeams,
} from "@/lib/bracket";

async function requireSuperadmin() {
  const admin = await getAdminInfo();
  if (!admin) return { error: "Tidak terautentikasi", status: 401 as const };
  if (admin.role !== "superadmin")
    return { error: "Hanya superadmin yang dapat mengelola bracket", status: 403 as const };
  return { admin };
}

export async function POST() {
  const guard = await requireSuperadmin();
  if ("error" in guard)
    return NextResponse.json({ success: false, message: guard.error }, { status: guard.status });

  const result = await generateBracket();
  if (!result.ok)
    return NextResponse.json({ success: false, message: result.message }, { status: 400 });
  return NextResponse.json({ success: true });
}

export async function DELETE() {
  const guard = await requireSuperadmin();
  if ("error" in guard)
    return NextResponse.json({ success: false, message: guard.error }, { status: guard.status });

  await resetBracket();
  return NextResponse.json({ success: true });
}

export async function PATCH(req: NextRequest) {
  const guard = await requireSuperadmin();
  if ("error" in guard)
    return NextResponse.json({ success: false, message: guard.error }, { status: guard.status });

  let body: {
    action?: string;
    matchId?: number;
    score1?: number;
    score2?: number;
    round?: number;
    bestOf?: number;
    matchAId?: number;
    sideA?: number;
    matchBId?: number;
    sideB?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: "Permintaan tidak valid" }, { status: 400 });
  }

  let result: { ok: boolean; message?: string };
  switch (body.action) {
    case "result":
      result = await setMatchResult(
        Number(body.matchId),
        Number(body.score1),
        Number(body.score2)
      );
      break;
    case "roundBo":
      result = await setRoundBestOf(Number(body.round), Number(body.bestOf));
      break;
    case "swap":
      result = await swapTeams(
        Number(body.matchAId),
        (body.sideA === 2 ? 2 : 1) as 1 | 2,
        Number(body.matchBId),
        (body.sideB === 2 ? 2 : 1) as 1 | 2
      );
      break;
    default:
      return NextResponse.json({ success: false, message: "Aksi tidak dikenal" }, { status: 400 });
  }

  if (!result.ok)
    return NextResponse.json({ success: false, message: result.message }, { status: 400 });
  return NextResponse.json({ success: true });
}
