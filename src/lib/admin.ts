import { verifyPassword } from "./password";

export type AdminRole = "admin" | "superadmin";

export type AdminSession = {
  id: number;
  email: string;
  name: string | null;
  role: AdminRole;
};

/**
 * Authenticate an admin against the database.
 * Returns the admin record on success, or null on failure / db error.
 */
export async function authenticateAdmin(
  email: string,
  password: string
): Promise<AdminSession | null> {
  const normalizedEmail = email.trim().toLowerCase();
  if (!normalizedEmail || !password) return null;

  try {
    const { db } = await import("@/db");
    const { admins } = await import("@/db/schema");
    const { eq } = await import("drizzle-orm");

    const rows = await db
      .select()
      .from(admins)
      .where(eq(admins.email, normalizedEmail))
      .limit(1);

    const admin = rows[0];
    if (!admin) return null;

    const valid = await verifyPassword(password, admin.passwordHash);
    if (!valid) return null;

    return {
      id: admin.id,
      email: admin.email,
      name: admin.name,
      role: (admin.role === "superadmin" ? "superadmin" : "admin") as AdminRole,
    };
  } catch (error) {
    console.error("authenticateAdmin failed:", error);
    return null;
  }
}
