// Client-side proof-of-registration image generator (Canvas 2D).
// Drawn manually (not html2canvas) so it doesn't choke on Tailwind v4 oklch()
// colors or the Flaticon icon font, and produces a clean branded receipt.

export type ProofPlayer = {
  name?: string;
  mlId?: string;
  server?: string;
};

export type ProofData = {
  teamName: string;
  leaderName: string;
  leaderWhatsapp: string;
  slot: number;
  players: ProofPlayer[];
  substitutes?: ProofPlayer[];
};

const COLORS = {
  ink: "#111827",
  sub: "#6b7280",
  faint: "#9ca3af",
  line: "#f1f5f9",
  orange: "#f97316",
  peach: "#fff7ed",
  white: "#ffffff",
};

function font(weight: number, size: number) {
  return `${weight} ${size}px 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif`;
}

function slug(s: string) {
  return (
    s
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "tim"
  );
}

export async function downloadProofImage(data: ProofData) {
  // Make sure the web font is ready so canvas text uses it.
  try {
    await (document as unknown as { fonts?: { ready?: Promise<unknown> } })
      .fonts?.ready;
  } catch {
    /* ignore */
  }

  const subs = (data.substitutes ?? []).filter(
    (s) => s && s.name && s.name.trim()
  );
  const players = data.players ?? [];

  const scale = 2;
  const W = 720;
  const pad = 40;

  const headerH = 176;
  const rowInfo = 40;
  const rowPlayer = 52;
  const rowTitle = 34;
  const rowTurn = 30;

  // --- compute total height ---
  let H = headerH + 26;
  H += 42; // team name
  H += rowTitle + 4 * rowInfo + 16; // informasi tim (4 rows)
  H += rowTitle + players.length * rowPlayer + 12; // pemain inti
  if (subs.length) H += 14 + rowTitle + subs.length * rowPlayer + 12;
  H += rowTitle + 3 * rowTurn + 20; // info turnamen
  H += 66; // footer
  H += 12; // bottom padding

  const canvas = document.createElement("canvas");
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.scale(scale, scale);
  ctx.textBaseline = "top";

  // background
  ctx.fillStyle = COLORS.white;
  ctx.fillRect(0, 0, W, H);

  // ---------- header ----------
  const grad = ctx.createLinearGradient(0, 0, W, headerH);
  grad.addColorStop(0, "#f59e0b");
  grad.addColorStop(0.5, "#f97316");
  grad.addColorStop(1, "#ea580c");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, headerH);

  // check badge
  const cx = W / 2;
  const cyBadge = 60;
  ctx.beginPath();
  ctx.arc(cx, cyBadge, 32, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.white;
  ctx.fill();
  ctx.strokeStyle = COLORS.orange;
  ctx.lineWidth = 5;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.beginPath();
  ctx.moveTo(cx - 13, cyBadge + 1);
  ctx.lineTo(cx - 4, cyBadge + 10);
  ctx.lineTo(cx + 14, cyBadge - 11);
  ctx.stroke();

  // header text
  ctx.textAlign = "center";
  ctx.fillStyle = COLORS.white;
  ctx.font = font(800, 24);
  ctx.fillText("BUKTI PENDAFTARAN", cx, 112);
  ctx.font = font(600, 13);
  ctx.globalAlpha = 0.9;
  ctx.fillText("Warkop Sippo Tournament • Mobile Legends", cx, 144);
  ctx.globalAlpha = 1;

  // ---------- body ----------
  let y = headerH + 26;

  // team name
  ctx.textAlign = "left";
  ctx.fillStyle = COLORS.ink;
  ctx.font = font(800, 26);
  ctx.fillText(data.teamName || "-", pad, y, W - pad * 2);
  y += 42;

  const sectionTitle = (label: string) => {
    ctx.textAlign = "left";
    ctx.fillStyle = COLORS.orange;
    ctx.font = font(700, 12);
    ctx.fillText(label.toUpperCase(), pad, y);
    y += rowTitle;
  };

  const infoRow = (label: string, value: string) => {
    ctx.textAlign = "left";
    ctx.fillStyle = COLORS.sub;
    ctx.font = font(600, 13);
    ctx.fillText(label, pad, y + 4);
    ctx.textAlign = "right";
    ctx.fillStyle = COLORS.ink;
    ctx.font = font(700, 14);
    ctx.fillText(value, W - pad, y + 3, W / 2);
    // separator
    ctx.strokeStyle = COLORS.line;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(pad, y + rowInfo - 8);
    ctx.lineTo(W - pad, y + rowInfo - 8);
    ctx.stroke();
    y += rowInfo;
  };

  const playerRow = (i: number, p: ProofPlayer, captain: boolean) => {
    const bx = pad + 13;
    const by = y + 13;
    ctx.beginPath();
    ctx.arc(bx, by, 13, 0, Math.PI * 2);
    ctx.fillStyle = COLORS.peach;
    ctx.fill();
    ctx.fillStyle = COLORS.orange;
    ctx.font = font(700, 12);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(String(i + 1), bx, by + 1);
    ctx.textBaseline = "top";

    ctx.textAlign = "left";
    ctx.fillStyle = COLORS.ink;
    ctx.font = font(700, 15);
    const name = (p.name || "-") + (captain ? "  (Captain)" : "");
    ctx.fillText(name, pad + 36, y, W - pad * 2 - 36);
    ctx.fillStyle = COLORS.faint;
    ctx.font = font(500, 12.5);
    ctx.fillText(
      `ID: ${p.mlId || "-"}   •   Server: ${p.server || "-"}`,
      pad + 36,
      y + 21,
      W - pad * 2 - 36
    );
    y += rowPlayer;
  };

  const turnRow = (label: string) => {
    ctx.textAlign = "left";
    ctx.fillStyle = COLORS.ink;
    ctx.font = font(600, 14);
    ctx.fillText(label, pad, y);
    y += rowTurn;
  };

  // Informasi Tim
  sectionTitle("Informasi Tim");
  infoRow("Ketua Tim", data.leaderName || "-");
  infoRow("WhatsApp", data.leaderWhatsapp || "-");
  infoRow("Jumlah Slot", `${data.slot} Slot`);
  infoRow(
    "Biaya Pendaftaran",
    `Rp ${(data.slot * 50000).toLocaleString("id-ID")}`
  );
  y += 16;

  // Pemain Inti
  sectionTitle("Pemain Inti");
  players.forEach((p, i) => playerRow(i, p, i === 0));
  y += 12;

  // Pemain Cadangan
  if (subs.length) {
    y += 2;
    sectionTitle("Pemain Cadangan");
    subs.forEach((p, i) => playerRow(i, p, false));
    y += 12;
  }

  // Info Turnamen
  sectionTitle("Info Turnamen");
  turnRow("Minggu, 9 Agustus 2026");
  turnRow("Pukul 17:00 WIB");
  turnRow("Warkop Sippo Wiyung");
  y += 20;

  // Footer
  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(pad, y);
  ctx.lineTo(W - pad, y);
  ctx.stroke();
  y += 14;
  const stamp = new Date().toLocaleString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  ctx.textAlign = "left";
  ctx.fillStyle = COLORS.faint;
  ctx.font = font(500, 12);
  ctx.fillText(`Dibuat: ${stamp} WIB`, pad, y);
  ctx.fillText(
    "Simpan & kirim bukti ini ke panitia via WhatsApp untuk konfirmasi.",
    pad,
    y + 20
  );

  // ---------- download ----------
  const link = document.createElement("a");
  link.download = `bukti-pendaftaran-${slug(data.teamName)}.png`;
  link.href = canvas.toDataURL("image/png");
  link.click();
}
