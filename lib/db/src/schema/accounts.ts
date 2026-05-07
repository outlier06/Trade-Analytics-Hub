import { pgTable, text, serial, timestamp, real, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const accountsTable = pgTable("accounts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  brokerName: text("broker_name"),
  accountType: text("account_type").notNull().default("forex"),
  initialBalance: real("initial_balance").notNull(),
  currentBalance: real("current_balance").notNull(),
  growthTarget: real("growth_target"),
  dailyLossLimit: real("daily_loss_limit"),
  maxDrawdown: real("max_drawdown"),
  maxTradesPerDay: integer("max_trades_per_day"),
  status: text("status").notNull().default("active"),
  currency: text("currency").notNull().default("USD"),
  notes: text("notes"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertAccountSchema = createInsertSchema(accountsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Account = typeof accountsTable.$inferSelect;
