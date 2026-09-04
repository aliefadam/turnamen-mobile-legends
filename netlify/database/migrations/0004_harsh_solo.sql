CREATE TABLE "registration_links" (
	"id" serial PRIMARY KEY NOT NULL,
	"token" varchar(16) NOT NULL,
	"created_by" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"expires_at" timestamp NOT NULL,
	"used_at" timestamp,
	CONSTRAINT "registration_links_token_unique" UNIQUE("token")
);
