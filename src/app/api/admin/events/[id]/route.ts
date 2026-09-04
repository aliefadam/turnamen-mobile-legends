import { NextRequest, NextResponse } from "next/server";
import { getAdminInfo } from "@/lib/admin-session";
import { deleteEvent, updateEvent } from "@/lib/events";

async function allowed() { return (await getAdminInfo())?.role === "superadmin"; }

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await allowed())) return NextResponse.json({ success: false, message: "Hanya superadmin yang dapat mengubah event." }, { status: 403 });
  const result = await updateEvent(Number((await params).id), await req.json());
  return NextResponse.json({ success: result.ok, ...result }, { status: result.ok ? 200 : 400 });
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await allowed())) return NextResponse.json({ success: false, message: "Hanya superadmin yang dapat menghapus event." }, { status: 403 });
  const result = await deleteEvent(Number((await params).id));
  return NextResponse.json({ success: result.ok }, { status: result.ok ? 200 : 404 });
}
