DROP TABLE "registration_links" CASCADE;--> statement-breakpoint
ALTER TABLE "registrations" ADD COLUMN "status" varchar(20) DEFAULT 'pending' NOT NULL;