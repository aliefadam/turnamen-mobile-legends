import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MLBB_NICKNAME_API = "https://api.isan.eu.org/nickname/ml";
const NUMERIC_ID = /^\d+$/;

type IsanResponse = {
  success?: boolean;
  name?: string;
  country?: string;
};

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("id")?.trim() ?? "";
  const server = req.nextUrl.searchParams.get("server")?.trim() ?? "";

  if (
    !NUMERIC_ID.test(id) ||
    !NUMERIC_ID.test(server) ||
    id.length > 20 ||
    server.length > 10
  ) {
    return NextResponse.json(
      { success: false, message: "ID dan server harus berupa angka." },
      { status: 400 },
    );
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);

  try {
    const url = new URL(MLBB_NICKNAME_API);
    url.searchParams.set("id", id);
    url.searchParams.set("zone", server);

    const response = await fetch(url, {
      headers: { Accept: "application/json" },
      signal: controller.signal,
      cache: "no-store",
    });
    const data = (await response.json().catch(() => null)) as IsanResponse | null;

    if (!response.ok || !data?.success || !data.name?.trim()) {
      return NextResponse.json(
        { success: false, message: "Akun Mobile Legends tidak ditemukan." },
        { status: 404 },
      );
    }

    return NextResponse.json(
      {
        success: true,
        nickname: data.name.trim(),
        country: data.country?.trim() || null,
      },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
        },
      },
    );
  } catch (error) {
    const timedOut = error instanceof Error && error.name === "AbortError";
    console.error("MLBB nickname lookup failed:", error);
    return NextResponse.json(
      {
        success: false,
        message: timedOut
          ? "Pengecekan nickname terlalu lama."
          : "Layanan pengecekan nickname sedang tidak tersedia.",
      },
      { status: 503 },
    );
  } finally {
    clearTimeout(timeout);
  }
}
