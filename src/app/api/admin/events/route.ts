import { NextRequest, NextResponse } from "next/server";
import { getAdminInfo } from "@/lib/admin-session";
import { createEvent } from "@/lib/events";

export async function POST(req: NextRequest) {
  const admin = await getAdminInfo();
  if (admin?.role !== "superadmin") return NextResponse.json({ success: false, message: "Hanya superadmin yang dapat membuat event." }, { status: 403 });
  const result = await createEvent(await req.json());
  return NextResponse.json({ success: result.ok, ...result }, { status: result.ok ? 201 : 400 });
}
