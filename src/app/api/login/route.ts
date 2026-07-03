import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_VALUE, SESSION_INFO_COOKIE } from "@/lib/auth";
import { authenticateAdmin } from "@/lib/admin";
import { encodeAdminInfo } from "@/lib/admin-session";

export async function POST(req: NextRequest) {
  let email = "";
  let password = "";
  try {
    const body = await req.json();
    email = String(body.email ?? "");
    password = String(body.password ?? "");
  } catch {
    return NextResponse.json(
      { success: false, message: "Permintaan tidak valid" },
      { status: 400 }
    );
  }

  const admin = await authenticateAdmin(email, password);
  if (!admin) {
    return NextResponse.json(
      { success: false, message: "Email atau password salah" },
      { status: 401 }
    );
  }

  const res = NextResponse.json({ success: true, role: admin.role });
  const cookieOpts = {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8, // 8 hours
  };
  res.cookies.set(SESSION_COOKIE, SESSION_VALUE, cookieOpts);
  res.cookies.set(
    SESSION_INFO_COOKIE,
    encodeAdminInfo({ email: admin.email, name: admin.name, role: admin.role }),
    cookieOpts
  );
  return res;
}
