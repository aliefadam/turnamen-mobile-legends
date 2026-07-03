import { config } from "dotenv";

// Load env BEFORE importing anything that connects to the DB.
config({ path: ".env.local", quiet: true });

// All dummy teams share this name prefix so they can be purged cleanly.
const PREFIX = "DUMMY ";
const COUNT = 15;

async function main() {
  const mode = process.argv[2]; // "purge" to remove, otherwise seed
  const { db, pool } = await import("./index");
  const { registrations, bracketMatches } = await import("./schema");
  const { like } = await import("drizzle-orm");

  if (mode === "purge") {
    // Bracket is a snapshot of teams — clear it too so nothing dangles.
    await db.delete(bracketMatches);
    const del = await db
      .delete(registrations)
      .where(like(registrations.teamName, `${PREFIX}%`))
      .returning({ id: registrations.id });
    console.log(`✓ ${del.length} tim dummy dihapus + bracket dibersihkan.`);
    await pool.end();
    process.exit(0);
  }

  // Seed: remove any existing dummies first (idempotent), then insert fresh.
  await db.delete(registrations).where(like(registrations.teamName, `${PREFIX}%`));

  const rows = Array.from({ length: COUNT }, (_, i) => {
    const n = String(i + 1).padStart(2, "0");
    return {
      teamName: `${PREFIX}${n}`,
      leaderName: `Ketua Dummy ${n}`,
      leaderWhatsapp: `08000000${n}00`,
      player1Name: `P1-${n}`, player1MlId: "1", player1Server: "1",
      player2Name: `P2-${n}`, player2MlId: "2", player2Server: "2",
      player3Name: `P3-${n}`, player3MlId: "3", player3Server: "3",
      player4Name: `P4-${n}`, player4MlId: "4", player4Server: "4",
      player5Name: `P5-${n}`, player5MlId: "5", player5Server: "5",
      slot: 1,
      status: "confirmed", // langsung confirmed agar bisa masuk bracket
    };
  });

  await db.insert(registrations).values(rows);
  console.log(`✓ ${COUNT} tim dummy dibuat (status: confirmed), prefix "${PREFIX}".`);
  console.log(`  Hapus semua kapan saja: npm run db:purge:dummy`);
  await pool.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("Gagal:", err);
  process.exit(1);
});
