import { cookies } from "next/headers";
import { SESSION_INFO_COOKIE } from "./auth";
import type { AdminRole } from "./admin";

export type AdminInfo = {
  email: string;
  name: string | null;
  role: AdminRole;
};

// base64url (cookie-safe, no padding) encode/decode of the identity payload.
export function encodeAdminInfo(info: AdminInfo): string {
  return Buffer.from(JSON.stringify(info)).toString("base64url");
}

export function decodeAdminInfo(raw: string): AdminInfo | null {
  try {
    const parsed = JSON.parse(Buffer.from(raw, "base64url").toString("utf8"));
    if (!parsed || typeof parsed.email !== "string") return null;
    return {
      email: parsed.email,
      name: parsed.name ?? null,
      role: parsed.role === "superadmin" ? "superadmin" : "admin",
    };
  } catch {
    return null;
  }
}

/** Read the current admin identity from the cookie (server components / route handlers). */
export async function getAdminInfo(): Promise<AdminInfo | null> {
  const store = await cookies();
  const raw = store.get(SESSION_INFO_COOKIE)?.value;
  return raw ? decodeAdminInfo(raw) : null;
}

/** True if the current session is a superadmin. */
export async function isSuperadmin(): Promise<boolean> {
  const info = await getAdminInfo();
  return info?.role === "superadmin";
}
