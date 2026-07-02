// Temporary hardcoded admin credentials.
// TODO: replace with real user store + hashed passwords before production.
export const ADMIN_EMAIL = "admin@example.com";
export const ADMIN_PASSWORD = "123123";

export const SESSION_COOKIE = "admin_session";
// Static session token (temporary). Swap for a signed/JWT session later.
export const SESSION_VALUE = "ml-admin-session-2026";

export function verifyCredentials(email: string, password: string): boolean {
  return (
    email.trim().toLowerCase() === ADMIN_EMAIL && password === ADMIN_PASSWORD
  );
}
