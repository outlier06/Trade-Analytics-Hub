import { pgTable, text, serial, timestamp, real, integer, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { accountsTable } from "./accounts";

export const tradesTable = pgTable("trades", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull().references(() => accountsTable.id, { onDelete: "cascade" }),
  tradeDate: timestamp("trade_date", { withTimezone: true }).notNull(),
  asset: text("asset").notNull(),
  direction: text("direction").notNull(),
  strategy: text("strategy"),
  setup: text("setup"),
  timeframe: text("timeframe"),
  higherTimeframeBias: text("higher_timeframe_bias"),
  entryTrigger: text("entry_trigger"),
  session: text("session"),
  entryPrice: real("entry_price"),
  stopLoss: real("stop_loss"),
  takeProfit: real("take_profit"),
  riskPercent: real("risk_percent"),
  riskAmount: real("risk_amount"),
  riskReward: real("risk_reward"),
  result: text("result").notNull(),
  pnl: real("pnl"),
  followedPlan: boolean("followed_plan"),
  validSetup: boolean("valid_setup"),
  impulsiveTrade: boolean("impulsive_trade"),
  riskRespected: boolean("risk_respected"),
  emotionBefore: text("emotion_before"),
  emotionAfter: text("emotion_after"),
  disciplineScore: integer("discipline_score"),
  notes: text("notes"),
  tags: text("tags"),
  screenshotUrl: text("screenshot_url"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertTradeSchema = createInsertSchema(tradesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type Trade = typeof tradesTable.$inferSelect;
