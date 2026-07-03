import { NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_INFO_COOKIE } from "@/lib/auth";

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(SESSION_COOKIE, "", { path: "/", maxAge: 0 });
  res.cookies.set(SESSION_INFO_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}
