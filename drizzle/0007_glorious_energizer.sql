ALTER TABLE "registrations" ADD COLUMN "attended" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "attendance" jsonb;