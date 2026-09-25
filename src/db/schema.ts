import { blob, integer, sqliteTable, text, primaryKey } from "drizzle-orm/sqlite-core";

export const settings = sqliteTable("settings", {
  id: integer("id").primaryKey(),
  publicOpen: integer("public_open").notNull().default(1),
  juryOpen: integer("jury_open").notNull().default(1),
});

export const candidates = sqliteTable("candidates", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  song: text("song").notNull().default(""),
  city: text("city").notNull().default(""),
  photoType: text("photo_type"),
  photoUrl: text("photo_url"),
  sortOrder: integer("sort_order").notNull().default(0),
  createdAt: text("created_at").notNull().default("(datetime('now'))"),
});

export const candidatePhotos = sqliteTable("candidate_photos", {
  candidateId: integer("candidate_id")
    .primaryKey()
    .references(() => candidates.id, { onDelete: "cascade" }),
  contentType: text("content_type").notNull(),
  data: blob("data", { mode: "buffer" }).notNull(),
});

export const publicVotes = sqliteTable("public_votes", {
  voterToken: text("voter_token").primaryKey(),
  candidateId: integer("candidate_id")
    .notNull()
    .references(() => candidates.id, { onDelete: "cascade" }),
  updatedAt: text("updated_at").notNull().default("(datetime('now'))"),
});

export const jurors = sqliteTable("jurors", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  createdAt: text("created_at").notNull().default("(datetime('now'))"),
});

export const juryScores = sqliteTable(
  "jury_scores",
  {
    jurorId: integer("juror_id")
      .notNull()
      .references(() => jurors.id, { onDelete: "cascade" }),
    candidateId: integer("candidate_id")
      .notNull()
      .references(() => candidates.id, { onDelete: "cascade" }),
    technique: integer("technique").notNull(),
    interpretation: integer("interpretation").notNull(),
    presence: integer("presence").notNull(),
    originality: integer("originality").notNull(),
    updatedAt: text("updated_at").notNull().default("(datetime('now'))"),
  },
  (table) => [primaryKey({ columns: [table.jurorId, table.candidateId] })],
);
