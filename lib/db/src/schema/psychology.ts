import { pgTable, text, serial, timestamp, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { accountsTable } from "./accounts";

export const psychologyLogsTable = pgTable("psychology_logs", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").references(() => accountsTable.id, { onDelete: "set null" }),
  logDate: timestamp("log_date", { withTimezone: true }).notNull(),
  emotionState: text("emotion_state").notNull(),
  energyLevel: integer("energy_level"),
  stressLevel: integer("stress_level"),
  focusLevel: integer("focus_level"),
  notes: text("notes"),
  tradedToday: boolean("traded_today"),
  followedRules: boolean("followed_rules"),
  overallScore: integer("overall_score"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertPsychologyLogSchema = createInsertSchema(psychologyLogsTable).omit({ id: true, createdAt: true });
export type InsertPsychologyLog = z.infer<typeof insertPsychologyLogSchema>;
export type PsychologyLog = typeof psychologyLogsTable.$inferSelect;
