import { relations, sql } from "drizzle-orm";
import {
  type AnyPgColumn,
  boolean,
  check,
  date,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

// Spec §8. Zod schemas in src/lib/schemas are the primary validation; the
// CHECK constraints below are a backstop so invalid rows can't be written at all.

const timestamptz = (name: string) => timestamp(name, { withTimezone: true });

export const theme = pgEnum("theme", ["minimal", "cards"]);
export const sectionType = pgEnum("section_type", [
  "projects",
  "experience",
  "education",
  "skills",
]);
export const linkKind = pgEnum("link_kind", [
  "github",
  "linkedin",
  "x",
  "email",
  "website",
  "other",
]);

export const profile = pgTable(
  "profile",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: text("user_id")
      .notNull()
      .unique()
      .references(() => user.id, { onDelete: "cascade" }),
    handle: text("handle").notNull().unique(),
    displayName: text("display_name").notNull(),
    headline: text("headline"),
    bio: text("bio"),
    location: text("location"),
    avatarKey: text("avatar_key"),
    theme: theme("theme").notNull().default("minimal"),
    isLive: boolean("is_live").notNull().default(false),
    liveVersionId: uuid("live_version_id").references(
      (): AnyPgColumn => profileVersion.id,
    ),
    lastPushedAt: timestamptz("last_pushed_at"),
    draftUpdatedAt: timestamptz("draft_updated_at").notNull().defaultNow(),
    previousHandle: text("previous_handle"),
    handleChangedAt: timestamptz("handle_changed_at"),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
    updatedAt: timestamptz("updated_at")
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (t) => [
    check(
      "profile_handle_format",
      sql`${t.handle} ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length(${t.handle}) BETWEEN 3 AND 30`,
    ),
    check("profile_display_name_length", sql`char_length(${t.displayName}) BETWEEN 1 AND 80`),
    check("profile_headline_length", sql`char_length(${t.headline}) <= 100`),
    check("profile_bio_length", sql`char_length(${t.bio}) <= 500`),
    check("profile_location_length", sql`char_length(${t.location}) <= 60`),
    check("profile_live_requires_version", sql`NOT ${t.isLive} OR ${t.liveVersionId} IS NOT NULL`),
  ],
);

export const handleHold = pgTable("handle_hold", {
  handle: text("handle").primaryKey(),
  profileId: uuid("profile_id")
    .notNull()
    .references(() => profile.id, { onDelete: "cascade" }),
  heldUntil: timestamptz("held_until").notNull(),
});

export const section = pgTable(
  "section",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    type: sectionType("type").notNull(),
    title: text("title").notNull(),
    position: integer("position").notNull(),
    visible: boolean("visible").notNull().default(true),
  },
  (t) => [
    unique("section_profile_type_unique").on(t.profileId, t.type),
    check("section_title_length", sql`char_length(${t.title}) BETWEEN 1 AND 40`),
  ],
);

export const item = pgTable(
  "item",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sectionId: uuid("section_id")
      .notNull()
      .references(() => section.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    description: text("description"),
    url: text("url"),
    sourceUrl: text("source_url"),
    imageKey: text("image_key"),
    imageAlt: text("image_alt"),
    // Month precision, stored as the 1st of the month. "YYYY-MM-DD" strings avoid time zones.
    startDate: date("start_date", { mode: "string" }),
    endDate: date("end_date", { mode: "string" }),
    position: integer("position").notNull(),
  },
  (t) => [
    index("item_section_id_idx").on(t.sectionId),
    check("item_title_length", sql`char_length(${t.title}) BETWEEN 1 AND 120`),
    check("item_subtitle_length", sql`char_length(${t.subtitle}) <= 120`),
    check("item_description_length", sql`char_length(${t.description}) <= 2000`),
    check("item_url_scheme", sql`${t.url} ~ '^https?://' AND char_length(${t.url}) <= 2048`),
    check(
      "item_source_url_scheme",
      sql`${t.sourceUrl} ~ '^https?://' AND char_length(${t.sourceUrl}) <= 2048`,
    ),
    check("item_image_alt_length", sql`char_length(${t.imageAlt}) <= 200`),
    check(
      "item_dates_month_precision",
      sql`extract(day from ${t.startDate}) = 1 AND extract(day from ${t.endDate}) = 1`,
    ),
    check("item_dates_order", sql`${t.endDate} >= ${t.startDate}`),
  ],
);

export const link = pgTable(
  "link",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    kind: linkKind("kind").notNull(),
    url: text("url").notNull(),
    position: integer("position").notNull(),
  },
  (t) => [
    index("link_profile_id_idx").on(t.profileId),
    check(
      "link_url_scheme",
      sql`${t.url} ~ '^(https?://|mailto:)' AND char_length(${t.url}) <= 2048`,
    ),
  ],
);

export const profileVersion = pgTable(
  "profile_version",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    profileId: uuid("profile_id")
      .notNull()
      .references(() => profile.id, { onDelete: "cascade" }),
    // Shape is defined by the snapshot schema in src/lib/schemas (added in F8).
    snapshot: jsonb("snapshot").notNull(),
    createdAt: timestamptz("created_at").notNull().defaultNow(),
  },
  (t) => [index("profile_version_profile_created_idx").on(t.profileId, t.createdAt.desc())],
);

// Fixed-window counters shared by every serverless instance: OTP sends per
// email and handle checks per IP. A window resets itself once reset_at passes.
export const rateLimit = pgTable("rate_limit", {
  key: text("key").primaryKey(),
  count: integer("count").notNull(),
  resetAt: timestamptz("reset_at").notNull(),
});

export const profileRelations = relations(profile, ({ one, many }) => ({
  user: one(user, { fields: [profile.userId], references: [user.id] }),
  sections: many(section),
  links: many(link),
  versions: many(profileVersion),
  holds: many(handleHold),
}));

export const sectionRelations = relations(section, ({ one, many }) => ({
  profile: one(profile, { fields: [section.profileId], references: [profile.id] }),
  items: many(item),
}));

export const itemRelations = relations(item, ({ one }) => ({
  section: one(section, { fields: [item.sectionId], references: [section.id] }),
}));

export const linkRelations = relations(link, ({ one }) => ({
  profile: one(profile, { fields: [link.profileId], references: [profile.id] }),
}));

export const profileVersionRelations = relations(profileVersion, ({ one }) => ({
  profile: one(profile, { fields: [profileVersion.profileId], references: [profile.id] }),
}));

export const handleHoldRelations = relations(handleHold, ({ one }) => ({
  profile: one(profile, { fields: [handleHold.profileId], references: [profile.id] }),
}));
