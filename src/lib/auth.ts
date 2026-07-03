// Session config (edge-safe — imported by proxy.ts, so no db/crypto here).
export const SESSION_COOKIE = "admin_session";
// Static session token. Swap for a signed/JWT session later.
export const SESSION_VALUE = "ml-admin-session-2026";
// Non-sensitive identity (email/role/name) for display in the panel.
export const SESSION_INFO_COOKIE = "admin_info";
