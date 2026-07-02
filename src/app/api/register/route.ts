import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { registrations } from "@/db/schema";
import { z } from "zod";
import { count, eq } from "drizzle-orm";

const playerSchema = z.object({
  name: z.string().min(1, "Nama pemain wajib diisi"),
  mlId: z.string().min(1, "ID Mobile Legend wajib diisi"),
  server: z.string().min(1, "Server wajib diisi"),
});

const optionalPlayerSchema = z.object({
  name: z.string().optional(),
  mlId: z.string().optional(),
  server: z.string().optional(),
});

const registrationSchema = z.object({
  teamName: z.string().min(2, "Nama tim minimal 2 karakter"),
  leaderName: z.string().min(2, "Nama ketua minimal 2 karakter"),
  leaderWhatsapp: z
    .string()
    .min(9, "Nomor WhatsApp tidak valid")
    .regex(/^[0-9+\-\s()]+$/, "Format nomor tidak valid"),
  slot: z.number().min(1).max(2),
  players: z.array(playerSchema).length(5),
  substitutes: z.array(optionalPlayerSchema).max(2).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = registrationSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors, message: "Data tidak valid" },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Check slot availability for this team name
    const existing = await db
      .select({ count: count() })
      .from(registrations)
      .where(eq(registrations.teamName, data.teamName));

    const existingCount = existing[0]?.count ?? 0;
    if (Number(existingCount) > 0) {
      return NextResponse.json(
        { success: false, message: "Nama tim sudah terdaftar. Gunakan nama tim yang berbeda." },
        { status: 409 }
      );
    }

    // Check total registrations (max slots)
    const totalSlots = await db.select({ total: count() }).from(registrations);
    const total = Number(totalSlots[0]?.total ?? 0);
    if (total >= 100) {
      return NextResponse.json(
        { success: false, message: "Slot pendaftaran sudah penuh." },
        { status: 400 }
      );
    }

    const subs = data.substitutes ?? [];
    const sub1 = subs[0];
    const sub2 = subs[1];

    const newReg = await db
      .insert(registrations)
      .values({
        teamName: data.teamName,
        leaderName: data.leaderName,
        leaderWhatsapp: data.leaderWhatsapp,
        slot: data.slot,
        player1Name: data.players[0].name,
        player1MlId: data.players[0].mlId,
        player1Server: data.players[0].server,
        player2Name: data.players[1].name,
        player2MlId: data.players[1].mlId,
        player2Server: data.players[1].server,
        player3Name: data.players[2].name,
        player3MlId: data.players[2].mlId,
        player3Server: data.players[2].server,
        player4Name: data.players[3].name,
        player4MlId: data.players[3].mlId,
        player4Server: data.players[3].server,
        player5Name: data.players[4].name,
        player5MlId: data.players[4].mlId,
        player5Server: data.players[4].server,
        sub1Name: sub1?.name || null,
        sub1MlId: sub1?.mlId || null,
        sub1Server: sub1?.server || null,
        sub2Name: sub2?.name || null,
        sub2MlId: sub2?.mlId || null,
        sub2Server: sub2?.server || null,
      })
      .returning();

    return NextResponse.json(
      { success: true, message: "Pendaftaran berhasil!", data: newReg[0] },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server. Coba lagi." },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const data = await db
      .select({ count: count() })
      .from(registrations);
    return NextResponse.json({ success: true, total: Number(data[0]?.count ?? 0) });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, total: 0 }, { status: 500 });
  }
}
