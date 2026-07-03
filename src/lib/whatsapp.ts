// WhatsApp notifications via self-hosted WA gateway (dokterkoding).
// Endpoint: POST /api/messages/send  ·  Auth: X-API-Key  ·  Body: { to, message }

const WA_BASE = "https://wa-gateway.dokterkoding.my.id";

// WhatsApp group (JID) that receives new-registration notifications.
// const GROUP_JID = "120363419728601551@g.us";
const GROUP_JID = "6281231698288-1554293243@g.us";
// Group invite link included in the confirmation message to team leaders.
const GROUP_LINK = "https://chat.whatsapp.com/IAjuCcFrVxX6FyXlA5J2Lc?mode=gi_t";

/**
 * Normalize a recipient. A group/JID (contains "@", e.g. xxxx@g.us) is passed
 * through untouched; a plain phone number is normalized to 62xxxx.
 */
function normalizePhone(phone: string): string {
  if (phone.includes("@")) return phone; // group/JID — don't strip
  let p = phone.replace(/[^0-9]/g, ""); // keep digits only: "+62 838-.." -> "62838.."
  if (p.startsWith("00")) p = p.slice(2); // intl "0062.." -> "62.."
  if (p.startsWith("62")) return p; // already has country code
  if (p.startsWith("0")) return "62" + p.slice(1); // "083.." -> "6283.."
  if (p.startsWith("8")) return "62" + p; // bare "83.." -> "6283.."
  return p;
}

function formatWhen(d: Date | string): string {
  const date = new Date(d);
  const datePart = date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
  const timePart = date
    .toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    })
    .replace(":", "."); // 24h "HH:mm" -> "HH.mm"
  return `${datePart} : ${timePart} WIB`;
}

/**
 * Send a WhatsApp text message. Never throws — returns true on success,
 * false on failure / when not configured, so callers can fire-and-forget.
 */
export async function sendWhatsApp(
  to: string,
  message: string,
): Promise<boolean> {
  const apiKey = process.env.WA_API_KEY;
  if (!apiKey) {
    console.warn("WA_API_KEY not set — skipping WhatsApp notification.");
    return false;
  }
  try {
    const res = await fetch(`${WA_BASE}/api/messages/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-API-Key": apiKey,
      },
      body: JSON.stringify({ to: normalizePhone(to), message }),
    });
    if (!res.ok) {
      console.error(
        "WhatsApp send failed:",
        res.status,
        await res.text().catch(() => ""),
      );
      return false;
    }
    return true;
  } catch (error) {
    console.error("WhatsApp send error:", error);
    return false;
  }
}

/** Notify the group that a new team registered. */
export async function notifyGroupNewRegistration(
  teamName: string,
  slot: number,
  createdAt: Date | string,
): Promise<boolean> {
  const message =
    `*Tim ${teamName}* telah mendaftar sebanyak ${slot} Slot\n` +
    `Terdaftar pada ${formatWhen(createdAt)}\n\n` +
    `_[Ini adalah Pesan Otomatis]_`;
  return sendWhatsApp(GROUP_JID, message);
}

/** Notify the team leader that their registration has been confirmed. */
export async function notifyLeaderConfirmed(
  leaderWhatsapp: string,
  teamName: string,
): Promise<boolean> {
  const message =
    `Pendaftaran atas nama *Tim ${teamName}* telah dikonfirmasi admin.\n\n` +
    `Silahkan bergabung ke group WhatsApp berikut untuk informasi turnamen lebih lanjut : \n${GROUP_LINK}\n\n` +
    `_[Ini adalah Pesan Otomatis]_`;
  return sendWhatsApp(leaderWhatsapp, message);
}
