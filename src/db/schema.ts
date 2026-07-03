import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
} from "drizzle-orm/pg-core";

export const registrations = pgTable("registrations", {
  id: serial("id").primaryKey(),
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
