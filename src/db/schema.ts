import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  jsonb,
} from "drizzle-orm/pg-core";

export const seasons = pgTable("seasons", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 120 }).notNull(),
  slug: varchar("slug", { length: 140 }).notNull().unique(),
  isActive: boolean("is_active").notNull().default(false),
  registrationOpen: boolean("registration_open").notNull().default(true),
  maxSlots: integer("max_slots").notNull().default(100),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Season = typeof seasons.$inferSelect;
export type NewSeason = typeof seasons.$inferInsert;

export const registrations = pgTable("registrations", {
  id: serial("id").primaryKey(),
  seasonId: integer("season_id").references(() => seasons.id, {
    onDelete: "set null",
  }),
  teamName: varchar("team_name", { length: 100 }).notNull(),
  leaderName: varchar("leader_name", { length: 100 }).notNull(),
  leaderWhatsapp: varchar("leader_whatsapp", { length: 20 }).notNull(),
  // Player fields (5 main + 2 sub)
  player1Name: varchar("player1_name", { length: 100 }).notNull(),
  player1MlId: varchar("player1_ml_id", { length: 50 }).notNull(),
  player1Server: varchar("player1_server", { length: 50 }).notNull(),
  player2Name: varchar("player2_name", { length: 100 }).notNull(),
  player2MlId: varchar("player2_ml_id", { length: 50 }).notNull(),
  player2Server: varchar("player2_server", { length: 50 }).notNull(),
  player3Name: varchar("player3_name", { length: 100 }).notNull(),
  player3MlId: varchar("player3_ml_id", { length: 50 }).notNull(),
  player3Server: varchar("player3_server", { length: 50 }).notNull(),
  player4Name: varchar("player4_name", { length: 100 }).notNull(),
  player4MlId: varchar("player4_ml_id", { length: 50 }).notNull(),
  player4Server: varchar("player4_server", { length: 50 }).notNull(),
  player5Name: varchar("player5_name", { length: 100 }).notNull(),
  player5MlId: varchar("player5_ml_id", { length: 50 }).notNull(),
  player5Server: varchar("player5_server", { length: 50 }).notNull(),
  // Substitute players (optional)
  sub1Name: varchar("sub1_name", { length: 100 }),
  sub1MlId: varchar("sub1_ml_id", { length: 50 }),
  sub1Server: varchar("sub1_server", { length: 50 }),
  sub2Name: varchar("sub2_name", { length: 100 }),
  sub2MlId: varchar("sub2_ml_id", { length: 50 }),
  sub2Server: varchar("sub2_server", { length: 50 }),
  slot: integer("slot").notNull().default(1),
  // Storage object path of the uploaded payment proof (Supabase Storage)
  paymentProofPath: text("payment_proof_path"),
  // Registration status: "pending" | "confirmed"
  status: varchar("status", { length: 20 }).notNull().default("pending"),
  // Team-level attendance (all expected players present / marked present)
  attended: boolean("attended").notNull().default(false),
  // Per-player attendance, keyed p1..p5 / s1..s2 (null = none checked yet)
  attendance: jsonb("attendance").$type<Record<string, boolean>>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Registration = typeof registrations.$inferSelect;
export type NewRegistration = typeof registrations.$inferInsert;

// Admin accounts for the admin panel login
export const admins = pgTable("admins", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  name: varchar("name", { length: 100 }),
  // Access level: "admin" | "superadmin"
  role: varchar("role", { length: 20 }).notNull().default("admin"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type Admin = typeof admins.$inferSelect;
export type NewAdmin = typeof admins.$inferInsert;

// Single-elimination bracket matches (one active bracket).
export const bracketMatches = pgTable("bracket_matches", {
  id: serial("id").primaryKey(),
  seasonId: integer("season_id").references(() => seasons.id, {
    onDelete: "set null",
  }),
  round: integer("round").notNull(), // 1 = first round
  slot: integer("slot").notNull(), // 0-based index within the round
  team1Id: integer("team1_id"),
  team2Id: integer("team2_id"),
  team1Name: varchar("team1_name", { length: 100 }),
  team2Name: varchar("team2_name", { length: 100 }),
  played: boolean("played").notNull().default(false),
  score1: integer("score1").notNull().default(0),
  score2: integer("score2").notNull().default(0),
  bestOf: integer("best_of").notNull().default(1),
  winnerSlot: integer("winner_slot"), // 1 or 2 (null = undecided)
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export type BracketMatch = typeof bracketMatches.$inferSelect;
export type NewBracketMatch = typeof bracketMatches.$inferInsert;
