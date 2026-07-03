import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { registrations } from "@/db/schema";
import { count, sql } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const name = (req.nextUrl.searchParams.get("name") ?? "").trim();

  if (name.length < 2) {
    return NextResponse.json({ available: null });
  }

  try {
    const rows = await db
      .select({ n: count() })
      .from(registrations)
      .where(sql`lower(${registrations.teamName}) = lower(${name})`);

    const taken = Number(rows[0]?.n ?? 0) > 0;
    return NextResponse.json({ available: !taken });
  } catch (error) {
    console.error("check-team failed:", error);
    return NextResponse.json({ available: null }, { status: 500 });
  }
}
