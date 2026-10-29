CREATE TYPE "public"."link_kind" AS ENUM('github', 'linkedin', 'x', 'email', 'website', 'other');--> statement-breakpoint
CREATE TYPE "public"."section_type" AS ENUM('projects', 'experience', 'education', 'skills');--> statement-breakpoint
CREATE TYPE "public"."theme" AS ENUM('minimal', 'cards');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean DEFAULT false NOT NULL,
	"image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "handle_hold" (
	"handle" text PRIMARY KEY NOT NULL,
	"profile_id" uuid NOT NULL,
	"held_until" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "item" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"section_id" uuid NOT NULL,
	"title" text NOT NULL,
	"subtitle" text,
	"description" text,
	"url" text,
	"source_url" text,
	"image_key" text,
	"image_alt" text,
	"start_date" date,
	"end_date" date,
	"position" integer NOT NULL,
	CONSTRAINT "item_title_length" CHECK (char_length("item"."title") BETWEEN 1 AND 120),
	CONSTRAINT "item_subtitle_length" CHECK (char_length("item"."subtitle") <= 120),
	CONSTRAINT "item_description_length" CHECK (char_length("item"."description") <= 2000),
	CONSTRAINT "item_url_scheme" CHECK ("item"."url" ~ '^https?://' AND char_length("item"."url") <= 2048),
	CONSTRAINT "item_source_url_scheme" CHECK ("item"."source_url" ~ '^https?://' AND char_length("item"."source_url") <= 2048),
	CONSTRAINT "item_image_alt_length" CHECK (char_length("item"."image_alt") <= 200),
	CONSTRAINT "item_dates_month_precision" CHECK (extract(day from "item"."start_date") = 1 AND extract(day from "item"."end_date") = 1),
	CONSTRAINT "item_dates_order" CHECK ("item"."end_date" >= "item"."start_date")
);
--> statement-breakpoint
CREATE TABLE "link" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"kind" "link_kind" NOT NULL,
	"url" text NOT NULL,
	"position" integer NOT NULL,
	CONSTRAINT "link_url_scheme" CHECK ("link"."url" ~ '^(https?://|mailto:)' AND char_length("link"."url") <= 2048)
);
--> statement-breakpoint
CREATE TABLE "profile" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"handle" text NOT NULL,
	"display_name" text NOT NULL,
	"headline" text,
	"bio" text,
	"location" text,
	"avatar_key" text,
	"theme" "theme" DEFAULT 'minimal' NOT NULL,
	"is_live" boolean DEFAULT false NOT NULL,
	"live_version_id" uuid,
	"last_pushed_at" timestamp with time zone,
	"draft_updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"previous_handle" text,
	"handle_changed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "profile_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "profile_handle_unique" UNIQUE("handle"),
	CONSTRAINT "profile_handle_format" CHECK ("profile"."handle" ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length("profile"."handle") BETWEEN 3 AND 30),
	CONSTRAINT "profile_display_name_length" CHECK (char_length("profile"."display_name") BETWEEN 1 AND 80),
	CONSTRAINT "profile_headline_length" CHECK (char_length("profile"."headline") <= 100),
	CONSTRAINT "profile_bio_length" CHECK (char_length("profile"."bio") <= 500),
	CONSTRAINT "profile_location_length" CHECK (char_length("profile"."location") <= 60),
	CONSTRAINT "profile_live_requires_version" CHECK (NOT "profile"."is_live" OR "profile"."live_version_id" IS NOT NULL)
);
--> statement-breakpoint
CREATE TABLE "profile_version" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"snapshot" jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limit" (
	"key" text PRIMARY KEY NOT NULL,
	"count" integer NOT NULL,
	"reset_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "section" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"profile_id" uuid NOT NULL,
	"type" "section_type" NOT NULL,
	"title" text NOT NULL,
	"position" integer NOT NULL,
	"visible" boolean DEFAULT true NOT NULL,
	CONSTRAINT "section_profile_type_unique" UNIQUE("profile_id","type"),
	CONSTRAINT "section_title_length" CHECK (char_length("section"."title") BETWEEN 1 AND 40)
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "handle_hold" ADD CONSTRAINT "handle_hold_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "item" ADD CONSTRAINT "item_section_id_section_id_fk" FOREIGN KEY ("section_id") REFERENCES "public"."section"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "link" ADD CONSTRAINT "link_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile" ADD CONSTRAINT "profile_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile" ADD CONSTRAINT "profile_live_version_id_profile_version_id_fk" FOREIGN KEY ("live_version_id") REFERENCES "public"."profile_version"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "profile_version" ADD CONSTRAINT "profile_version_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "section" ADD CONSTRAINT "section_profile_id_profile_id_fk" FOREIGN KEY ("profile_id") REFERENCES "public"."profile"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "account_userId_idx" ON "account" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "session_userId_idx" ON "session" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "verification_identifier_idx" ON "verification" USING btree ("identifier");--> statement-breakpoint
CREATE INDEX "item_section_id_idx" ON "item" USING btree ("section_id");--> statement-breakpoint
CREATE INDEX "link_profile_id_idx" ON "link" USING btree ("profile_id");--> statement-breakpoint
CREATE INDEX "profile_version_profile_created_idx" ON "profile_version" USING btree ("profile_id","created_at" DESC NULLS LAST);