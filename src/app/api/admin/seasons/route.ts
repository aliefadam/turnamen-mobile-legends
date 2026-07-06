import { NextRequest, NextResponse } from "next/server";
import { getAdminInfo } from "@/lib/admin-session";
import {
  activateSeason,
  createSeason,
  updateSeasonSettings,
} from "@/lib/seasons";

async function requireSuperadmin() {
  const admin = await getAdminInfo();
  if (!admin) return { error: "Tidak terautentikasi", status: 401 as const };
  if (admin.role !== "superadmin") {
    return { error: "Hanya superadmin yang dapat mengelola season", status: 403 as const };
  }
  return { admin };
}

export async function POST(req: NextRequest) {
  const guard = await requireSuperadmin();
  if ("error" in guard) {
    return NextResponse.json({ success: false, message: guard.error }, { status: guard.status });
  }

  try {
    const body = (await req.json()) as {
      name?: string;
      slug?: string;
      makeActive?: boolean;
      registrationOpen?: boolean;
      maxSlots?: number;
    };

    const result = await createSeason({
      name: body.name ?? "",
      slug: body.slug,
      makeActive: body.makeActive,
      registrationOpen: body.registrationOpen,
      maxSlots: body.maxSlots,
    });

    if (!result.ok) {
      return NextResponse.json({ success: false, message: result.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, season: result.season });
  } catch (error) {
    console.error("Create season error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const guard = await requireSuperadmin();
  if ("error" in guard) {
    return NextResponse.json({ success: false, message: guard.error }, { status: guard.status });
  }

  try {
    const body = (await req.json()) as {
      action?: string;
      seasonId?: number;
      registrationOpen?: boolean;
      maxSlots?: number;
    };

    if (body.action === "activate") {
      const result = await activateSeason(Number(body.seasonId));
      if (!result.ok) {
        return NextResponse.json({ success: false, message: result.message }, { status: 400 });
      }
      return NextResponse.json({ success: true });
    }

    if (body.action === "settings") {
      const result = await updateSeasonSettings(Number(body.seasonId), {
        registrationOpen: body.registrationOpen,
        maxSlots: body.maxSlots,
      });
      if (!result.ok) {
        return NextResponse.json({ success: false, message: result.message }, { status: 400 });
      }
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, message: "Aksi tidak dikenal." }, { status: 400 });
  } catch (error) {
    console.error("Update season error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server." },
      { status: 500 }
    );
  }
}
