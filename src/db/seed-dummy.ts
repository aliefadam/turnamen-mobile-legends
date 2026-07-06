import { config } from "dotenv";

// Load env BEFORE importing anything that connects to the DB.
config({ path: ".env.local", quiet: true });

// Total entrant target: 32 slots = 25 teams, with 7 teams taking 2 slots.
const PREFIX = "d_";
const LEGACY_PREFIX = "DUMMY ";
const TEAM_COUNT = 25;
const DOUBLE_SLOT_COUNT = 7;
const TEAM_ALIASES = [
  "alpha",
  "yourEvl",
  "onic",
  "aether",
  "vortex",
  "nova",
  "zenith",
  "ravens",
  "inferno",
  "mythic",
  "valkyrie",
  "sentinel",
  "horizon",
  "phantom",
  "cyclone",
  "tempest",
  "aurora",
  "titans",
  "eclipse",
  "blitz",
  "wildcore",
  "orbit",
  "luminate",
  "nebulon",
  "fireflux",
  "stormrage",
  "obsidian",
  "skyline",
  "nightfall",
  "draconic",
  "venomix",
  "frostbyte",
];

function buildRows(seasonId: number) {
  return Array.from({ length: TEAM_COUNT }, (_, i) => {
    const n = String(i + 1).padStart(2, "0");
    const slot = i < DOUBLE_SLOT_COUNT ? 2 : 1;
    const alias = TEAM_ALIASES[i] ?? `team${n}`;
    const teamName = `${PREFIX}${alias}`;

    return {
      seasonId,
      teamName,
      leaderName: `Ketua ${alias}`,
      leaderWhatsapp: `080000${String(i + 1).padStart(6, "0")}`,
      player1Name: `p1_${n}`,
      player1MlId: "1",
      player1Server: "1",
      player2Name: `p2_${n}`,
      player2MlId: "2",
      player2Server: "2",
      player3Name: `p3_${n}`,
      player3MlId: "3",
      player3Server: "3",
      player4Name: `p4_${n}`,
      player4MlId: "4",
      player4Server: "4",
      player5Name: `p5_${n}`,
      player5MlId: "5",
      player5Server: "5",
      slot,
      status: "confirmed" as const,
    };
  });
}

async function main() {
  const mode = process.argv[2];
  const { db, pool } = await import("./index");
  const { bracketMatches, registrations, seasons } = await import("./schema");
  const { eq, like, or } = await import("drizzle-orm");

  let activeSeason = await db
    .select()
    .from(seasons)
    .where(eq(seasons.isActive, true))
    .limit(1);

  if (!activeSeason[0] && mode !== "purge") {
    activeSeason = await db
      .insert(seasons)
      .values({
        name: "Season 1",
        slug: "season-1",
        isActive: true,
        registrationOpen: true,
        maxSlots: 100,
      })
      .returning();
  }

  const season = activeSeason[0] ?? null;

  const dummyFilter = or(
    like(registrations.teamName, `${PREFIX}%`),
    like(registrations.teamName, `${LEGACY_PREFIX}%`)
  );

  if (mode === "purge") {
    if (season) {
      await db.delete(bracketMatches).where(eq(bracketMatches.seasonId, season.id));
      const del = await db
        .delete(registrations)
        .where(eq(registrations.seasonId, season.id))
        .returning({ id: registrations.id });
      console.log(`✓ ${del.length} tim dummy season aktif dihapus + bracket dibersihkan.`);
    } else {
      const del = await db
        .delete(registrations)
        .where(dummyFilter)
        .returning({ id: registrations.id });
      console.log(`✓ ${del.length} tim dummy lama dihapus.`);
    }
    await pool.end();
    process.exit(0);
  }

  if (!season) {
    console.error("Gagal: tidak ada season aktif.");
    await pool.end();
    process.exit(1);
  }

  await db.delete(bracketMatches).where(eq(bracketMatches.seasonId, season.id));
  await db.delete(registrations).where(eq(registrations.seasonId, season.id));

  const rows = buildRows(season.id);
  const totalSlots = rows.reduce((sum, row) => sum + row.slot, 0);

  await db.insert(registrations).values(rows);
  console.log(
    `✓ ${TEAM_COUNT} tim dummy dibuat untuk ${season.name} (${DOUBLE_SLOT_COUNT} tim slot 2, total ${totalSlots} slot), prefix "${PREFIX}".`
  );
  console.log("  Hapus semua kapan saja: npm run db:purge:dummy");
  await pool.end();
  process.exit(0);
}

main().catch((err) => {
  console.error("Gagal:", err);
  process.exit(1);
});
