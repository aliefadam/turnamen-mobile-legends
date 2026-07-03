CREATE TABLE "bracket_matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"round" integer NOT NULL,
	"slot" integer NOT NULL,
	"team1_id" integer,
	"team2_id" integer,
	"team1_name" varchar(100),
	"team2_name" varchar(100),
	"score1" integer DEFAULT 0 NOT NULL,
	"score2" integer DEFAULT 0 NOT NULL,
	"best_of" integer DEFAULT 1 NOT NULL,
	"winner_slot" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
