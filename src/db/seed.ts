import { config } from "dotenv";

// Load env BEFORE importing anything that connects to the DB.
config({ path: ".env.local" });

type Seed = {
  email: string;
  password: string;
  name: string;
  role: "admin" | "superadmin";
};

const seeds: Seed[] = [
  {
    email: "admin@warkopsippo.com",
    password: "sippo12345",
    name: "Admin Warkop Sippo",
    role: "admin",
  },
  {
    email: "superadmin@warkopsippo.com",
    password: "210703",
    name: "Super Admin",
    role: "superadmin",
  },
];

async function main() {
  const { db, pool } = await import("./index");
  const { admins } = await import("./schema");
  const { hashPassword } = await import("../lib/password");
  const { eq, notInArray } = await import("drizzle-orm");

  // Remove any admin accounts that are no longer in the seed list.
  const keepEmails = seeds.map((s) => s.email.trim().toLowerCase());
  const removed = await db
    .delete(admins)
    .where(notInArray(admins.email, keepEmails))
    .returning({ email: admins.email });
  removed.forEach((r) => console.log(`✗ ${r.email} — dihapus (tidak di seed).`));

  for (const s of seeds) {
    const email = s.email.trim().toLowerCase();
    const passwordHash = await hashPassword(s.password);

    const existing = await db
      .select()
      .from(admins)
      .where(eq(admins.email, email))
      .limit(1);

    if (existing.length > 0) {
      await db
        .update(admins)
        .set({ passwordHash, name: s.name, role: s.role })
        .where(eq(admins.email, email));
      console.log(`✓ [${s.role}] ${email} — diperbarui.`);
    } else {
      await db
        .insert(admins)
        .values({ email, passwordHash, name: s.name, role: s.role });
      console.log(`✓ [${s.role}] ${email} — dibuat.`);
    }
  }

  console.log("\nSeed selesai:");
  seeds.forEach((s) => console.log(`  ${s.role.padEnd(10)} ${s.email} / ${s.password}`));

  await pool.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("Seed gagal:", err);
  process.exit(1);
});
