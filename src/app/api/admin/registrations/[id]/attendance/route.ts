import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { registrations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getAdminInfo } from "@/lib/admin-session";
import { getActiveSeason } from "@/lib/seasons";

async function requireSuperadmin() {
  const admin = await getAdminInfo();
  if (!admin) return { error: "Tidak terautentikasi", status: 401 as const };
  if (admin.role !== "superadmin")
    return { error: "Hanya superadmin yang dapat melakukan aksi ini", status: 403 as const };
  return { admin };
}

/** Keys of players expected to attend for a registration. */
function expectedKeys(r: typeof registrations.$inferSelect): string[] {
  const keys = ["p1", "p2", "p3", "p4", "p5"];
  if (r.sub1Name) keys.push("s1");
  if (r.sub2Name) keys.push("s2");
  return keys;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const guard = await requireSuperadmin();
  if ("error" in guard) {
    return NextResponse.json({ success: false, message: guard.error }, { status: guard.status });
  }

  const { id: idRaw } = await params;
  const id = Number(idRaw);
  if (!Number.isFinite(id)) {
    return NextResponse.json({ success: false, message: "ID tidak valid" }, { status: 400 });
  }

  let body: { action?: string; key?: string; present?: boolean };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ success: false, message: "Permintaan tidak valid" }, { status: 400 });
  }

  try {
    const season = await getActiveSeason();
    if (!season) {
      return NextResponse.json({ success: false, message: "Belum ada season aktif" }, { status: 400 });
    }

    const { and } = await import("drizzle-orm");
    const rows = await db
      .select()
      .from(registrations)
      .where(and(eq(registrations.id, id), eq(registrations.seasonId, season.id)))
      .limit(1);
    const reg = rows[0];
    if (!reg) {
      return NextResponse.json({ success: false, message: "Data tidak ditemukan" }, { status: 404 });
    }

    const keys = expectedKeys(reg);
    let attendance: Record<string, boolean> = { ...(reg.attendance ?? {}) };

    switch (body.action) {
      case "togglePlayer": {
        const key = String(body.key ?? "");
        if (!keys.includes(key)) {
          return NextResponse.json({ success: false, message: "Pemain tidak valid" }, { status: 400 });
        }
        attendance[key] = Boolean(body.present);
        break;
      }
      case "markAll": {
        attendance = {};
        for (const k of keys) attendance[k] = true;
        break;
      }
      case "reset": {
        attendance = {};
        break;
      }
      default:
        return NextResponse.json({ success: false, message: "Aksi tidak dikenal" }, { status: 400 });
    }

    // Team is "attended" only when every expected player is present.
    const attended = keys.length > 0 && keys.every((k) => attendance[k] === true);

    await db
      .update(registrations)
      .set({ attendance, attended })
      .where(and(eq(registrations.id, id), eq(registrations.seasonId, season.id)));

    return NextResponse.json({ success: true, attended, attendance });
  } catch (error) {
    console.error("Attendance update error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server. Coba lagi." },
      { status: 500 }
    );
  }
}
