import { config } from "dotenv";

// Load the local Netlify Database connection before importing the DB module.
config({ path: ".env.local", quiet: true });

const SUPERADMIN = {
  email: "superadmin@warkopsippo.com",
  password: "210703",
  name: "Super Admin",
  role: "superadmin" as const,
};

async function main() {
  const { db, pool } = await import("./index");
  const { admins } = await import("./schema");
  const { hashPassword } = await import("../lib/password");

  const email = SUPERADMIN.email.trim().toLowerCase();
  const passwordHash = await hashPassword(SUPERADMIN.password);

  await db
    .insert(admins)
    .values({
      email,
      passwordHash,
      name: SUPERADMIN.name,
      role: SUPERADMIN.role,
    })
    .onConflictDoUpdate({
      target: admins.email,
      set: {
        passwordHash,
        name: SUPERADMIN.name,
        role: SUPERADMIN.role,
      },
    });

  console.log(`Superadmin ${email} berhasil dibuat atau diperbarui.`);
  await pool.end();
}

main().catch((error) => {
  console.error("Seed superadmin gagal:", error);
  process.exitCode = 1;
});
