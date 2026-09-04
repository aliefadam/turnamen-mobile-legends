CREATE TABLE "events" (
  "id" serial PRIMARY KEY NOT NULL,
  "name" varchar(120) NOT NULL,
  "slug" varchar(140) NOT NULL,
  "registration_open" boolean DEFAULT true NOT NULL,
  "max_slots" integer DEFAULT 100 NOT NULL,
  "event_date" timestamp NOT NULL,
  "location" varchar(255) NOT NULL,
  "prize_pool" bigint DEFAULT 0 NOT NULL,
  "allow_two_slots" boolean DEFAULT false NOT NULL,
  "created_at" timestamp DEFAULT now() NOT NULL,
  "updated_at" timestamp DEFAULT now() NOT NULL,
  CONSTRAINT "events_slug_unique" UNIQUE("slug")
);
ALTER TABLE "registrations" ADD COLUMN "event_id" integer;
ALTER TABLE "bracket_matches" ADD COLUMN "event_id" integer;
INSERT INTO "events" ("name", "slug", "event_date", "location", "registration_open", "max_slots")
SELECT 'Event Data Lama', 'event-data-lama', now(), 'Warkop Sippo Wiyung', false, 100
WHERE EXISTS (SELECT 1 FROM "registrations") OR EXISTS (SELECT 1 FROM "bracket_matches");
UPDATE "registrations" SET "event_id" = (SELECT "id" FROM "events" WHERE "slug" = 'event-data-lama') WHERE "event_id" IS NULL;
UPDATE "bracket_matches" SET "event_id" = (SELECT "id" FROM "events" WHERE "slug" = 'event-data-lama') WHERE "event_id" IS NULL;
ALTER TABLE "registrations" ALTER COLUMN "event_id" SET NOT NULL;
ALTER TABLE "bracket_matches" ALTER COLUMN "event_id" SET NOT NULL;
ALTER TABLE "registrations" ADD CONSTRAINT "registrations_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE;
ALTER TABLE "bracket_matches" ADD CONSTRAINT "bracket_matches_event_id_events_id_fk" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE CASCADE;
