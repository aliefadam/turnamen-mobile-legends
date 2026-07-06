import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { registrations } from "@/db/schema";
import { z } from "zod";
import { and, count, eq, ne, sql } from "drizzle-orm";
import { getAdminInfo } from "@/lib/admin-session";
import { getActiveSeason } from "@/lib/seasons";

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

const updateSchema = z.object({
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

async function requireSuperadmin() {
  const admin = await getAdminInfo();
  if (!admin) return { error: "Tidak terautentikasi", status: 401 as const };
  if (admin.role !== "superadmin")
    return { error: "Hanya superadmin yang dapat melakukan aksi ini", status: 403 as const };
  return { admin };
}

export async function PUT(
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

  try {
    const season = await getActiveSeason();
    if (!season) {
      return NextResponse.json({ success: false, message: "Belum ada season aktif" }, { status: 400 });
    }

    let body: unknown;
    let proofFile: File | null = null;
    const contentType = req.headers.get("content-type") || "";
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const payload = form.get("payload");
      body = typeof payload === "string" ? JSON.parse(payload) : {};
      const proof = form.get("proof");
      if (proof instanceof File && proof.size > 0) proofFile = proof;
    } else {
      body = await req.json();
    }

    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, errors: parsed.error.flatten().fieldErrors, message: "Data tidak valid" },
        { status: 400 }
      );
    }
    const data = parsed.data;

    // Ensure the registration exists.
    const current = await db
      .select()
      .from(registrations)
      .where(and(eq(registrations.id, id), eq(registrations.seasonId, season.id)))
      .limit(1);
    if (current.length === 0) {
      return NextResponse.json({ success: false, message: "Data tidak ditemukan" }, { status: 404 });
    }

    // Team name must stay unique (excluding this row).
    const dupe = await db
      .select({ n: count() })
      .from(registrations)
      .where(
        and(
          eq(registrations.seasonId, season.id),
          sql`lower(${registrations.teamName}) = lower(${data.teamName})`,
          ne(registrations.id, id)
        )
      );
    if (Number(dupe[0]?.n ?? 0) > 0) {
      return NextResponse.json(
        { success: false, message: "Nama tim sudah dipakai tim lain." },
        { status: 409 }
      );
    }

    // Optional payment proof replacement.
    let paymentProofPath = current[0].paymentProofPath;
    if (proofFile) {
      const { uploadPaymentProof, removePaymentProof } = await import("@/lib/supabase");
      const newPath = await uploadPaymentProof(proofFile, data.teamName);
      if (newPath) {
        const old = paymentProofPath;
        paymentProofPath = newPath;
        if (old) await removePaymentProof(old);
      }
    }

    const subs = data.substitutes ?? [];
    const sub1 = subs[0];
    const sub2 = subs[1];

    await db
      .update(registrations)
      .set({
        paymentProofPath,
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
      .where(eq(registrations.id, id));

    return NextResponse.json({ success: true, message: "Data berhasil diperbarui" });
  } catch (error) {
    console.error("Update registration error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server. Coba lagi." },
      { status: 500 }
    );
  }
}

const statusSchema = z.object({
  status: z.enum(["pending", "confirmed"]),
});

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

  try {
    const season = await getActiveSeason();
    if (!season) {
      return NextResponse.json({ success: false, message: "Belum ada season aktif" }, { status: 400 });
    }

    const parsed = statusSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ success: false, message: "Status tidak valid" }, { status: 400 });
    }

    const updated = await db
      .update(registrations)
      .set({ status: parsed.data.status })
      .where(and(eq(registrations.id, id), eq(registrations.seasonId, season.id)))
      .returning({
        id: registrations.id,
        teamName: registrations.teamName,
        leaderWhatsapp: registrations.leaderWhatsapp,
      });

    if (updated.length === 0) {
      return NextResponse.json({ success: false, message: "Data tidak ditemukan" }, { status: 404 });
    }

    // On confirmation, notify the team leader via WhatsApp (best-effort).
    if (parsed.data.status === "confirmed") {
      try {
        const { notifyLeaderConfirmed } = await import("@/lib/whatsapp");
        await notifyLeaderConfirmed(updated[0].leaderWhatsapp, updated[0].teamName);
      } catch (waError) {
        console.error("WA notify (confirm) failed:", waError);
      }
    }

    return NextResponse.json({ success: true, status: parsed.data.status });
  } catch (error) {
    console.error("Update status error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server. Coba lagi." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: NextRequest,
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

  try {
    const season = await getActiveSeason();
    if (!season) {
      return NextResponse.json({ success: false, message: "Belum ada season aktif" }, { status: 400 });
    }

    const deleted = await db
      .delete(registrations)
      .where(and(eq(registrations.id, id), eq(registrations.seasonId, season.id)))
      .returning({ paymentProofPath: registrations.paymentProofPath });

    if (deleted.length === 0) {
      return NextResponse.json({ success: false, message: "Data tidak ditemukan" }, { status: 404 });
    }

    const path = deleted[0].paymentProofPath;
    if (path) {
      const { removePaymentProof } = await import("@/lib/supabase");
      await removePaymentProof(path);
    }

    return NextResponse.json({ success: true, message: "Data berhasil dihapus" });
  } catch (error) {
    console.error("Delete registration error:", error);
    return NextResponse.json(
      { success: false, message: "Terjadi kesalahan server. Coba lagi." },
      { status: 500 }
    );
  }
}
