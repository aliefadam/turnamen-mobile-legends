CREATE TABLE IF NOT EXISTS "events" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" varchar(120) NOT NULL,
  "slug" varchar(140) NOT NULL UNIQUE,
  "registration_open" boolean DEFAULT true NOT NULL,
  "max_slots" integer DEFAULT 100 NOT NULL,
  "event_date" timestamp NOT NULL,
  "location" varchar(255) NOT NULL,
  "prize_pool" bigint DEFAULT 0 NOT NULL,
  "allow_two_slots" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "admins" (
  "id" serial PRIMARY KEY NOT NULL,
  "email" varchar(255) NOT NULL UNIQUE,
  "password_hash" text NOT NULL,
  "name" varchar(100),
  "role" varchar(20) DEFAULT 'admin' NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "registrations" (
  "id" serial PRIMARY KEY NOT NULL,
  "event_id" integer,
  "team_name" varchar(100) NOT NULL,
  "leader_name" varchar(100) NOT NULL,
  "leader_whatsapp" varchar(20) NOT NULL,
  "player1_name" varchar(100) NOT NULL,
  "player1_ml_id" varchar(50) NOT NULL,
  "player1_server" varchar(50) NOT NULL,
  "player2_name" varchar(100) NOT NULL,
  "player2_ml_id" varchar(50) NOT NULL,
  "player2_server" varchar(50) NOT NULL,
  "player3_name" varchar(100) NOT NULL,
  "player3_ml_id" varchar(50) NOT NULL,
  "player3_server" varchar(50) NOT NULL,
  "player4_name" varchar(100) NOT NULL,
  "player4_ml_id" varchar(50) NOT NULL,
  "player4_server" varchar(50) NOT NULL,
  "player5_name" varchar(100) NOT NULL,
  "player5_ml_id" varchar(50) NOT NULL,
  "player5_server" varchar(50) NOT NULL,
  "sub1_name" varchar(100),
  "sub1_ml_id" varchar(50),
  "sub1_server" varchar(50),
  "sub2_name" varchar(100),
  "sub2_ml_id" varchar(50),
  "sub2_server" varchar(50),
  "slot" integer DEFAULT 1 NOT NULL,
  "payment_proof_path" text,
  "status" varchar(20) DEFAULT 'pending' NOT NULL,
  "attended" boolean DEFAULT false NOT NULL,
  "attendance" jsonb,
  "created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "bracket_matches" (
  "id" serial PRIMARY KEY NOT NULL,
  "event_id" integer,
  "round" integer NOT NULL,
  "slot" integer NOT NULL,
  "team1_id" integer,
  "team2_id" integer,
  "team1_name" varchar(100),
  "team2_name" varchar(100),
  "played" boolean DEFAULT false NOT NULL,
  "score1" integer DEFAULT 0 NOT NULL,
  "score2" integer DEFAULT 0 NOT NULL,
  "best_of" integer DEFAULT 1 NOT NULL,
  "winner_slot" integer,
  "created_at" timestamp DEFAULT now() NOT NULL
);

ALTER TABLE "admins" ADD COLUMN IF NOT EXISTS "role" varchar(20) DEFAULT 'admin' NOT NULL;
ALTER TABLE "registrations" ADD COLUMN IF NOT EXISTS "event_id" integer;
ALTER TABLE "registrations" ADD COLUMN IF NOT EXISTS "payment_proof_path" text;
ALTER TABLE "registrations" ADD COLUMN IF NOT EXISTS "status" varchar(20) DEFAULT 'pending' NOT NULL;
ALTER TABLE "registrations" ADD COLUMN IF NOT EXISTS "attended" boolean DEFAULT false NOT NULL;
ALTER TABLE "registrations" ADD COLUMN IF NOT EXISTS "attendance" jsonb;
ALTER TABLE "bracket_matches" ADD COLUMN IF NOT EXISTS "event_id" integer;
ALTER TABLE "bracket_matches" ADD COLUMN IF NOT EXISTS "played" boolean DEFAULT false NOT NULL;

INSERT INTO "events" ("name", "slug", "event_date", "location", "registration_open", "max_slots")
SELECT 'Event Data Lama', 'event-data-lama', now(), 'Warkop Sippo Wiyung', false, 100
WHERE (EXISTS (SELECT 1 FROM "registrations" WHERE "event_id" IS NULL)
   OR EXISTS (SELECT 1 FROM "bracket_matches" WHERE "event_id" IS NULL))
  AND NOT EXISTS (SELECT 1 FROM "events" WHERE "slug" = 'event-data-lama');

UPDATE "registrations" SET "event_id" = (SELECT "id" FROM "events" WHERE "slug" = 'event-data-lama') WHERE "event_id" IS NULL;
UPDATE "bracket_matches" SET "event_id" = (SELECT "id" FROM "events" WHERE "slug" = 'event-data-lama') WHERE "event_id" IS NULL;

ALTER TABLE "registrations" ALTER COLUMN "event_id" SET NOT NULL;
ALTER TABLE "bracket_matches" ALTER COLUMN "event_id" SET NOT NULL;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'registrations_event_id_events_id_fk') THEN
    ALTER TABLE "registrations" ADD CONSTRAINT "registrations_event_id_events_id_fk"
      FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'bracket_matches_event_id_events_id_fk') THEN
    ALTER TABLE "bracket_matches" ADD CONSTRAINT "bracket_matches_event_id_events_id_fk"
      FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE;
  END IF;
END $$;
