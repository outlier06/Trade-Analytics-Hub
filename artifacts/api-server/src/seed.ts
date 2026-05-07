import { eq } from "drizzle-orm";
import { db, accountsTable, tradesTable, psychologyLogsTable } from "@workspace/db";

async function seed() {
  console.log("Seeding...");

  const [acc1] = await db.insert(accountsTable).values({
    name: "NAS100 Live",
    brokerName: "IC Markets",
    accountType: "forex",
    initialBalance: 10000,
    currentBalance: 10000,
    currency: "USD",
    status: "active",
    growthTarget: 20,
    dailyLossLimit: 300,
    maxDrawdown: 10,
  }).returning();

  const [acc2] = await db.insert(accountsTable).values({
    name: "FTMO 50K",
    brokerName: "FTMO",
    accountType: "prop_firm",
    initialBalance: 50000,
    currentBalance: 50000,
    currency: "USD",
    status: "active",
    maxDrawdown: 5,
    dailyLossLimit: 2500,
  }).returning();

  const d = (s: string) => new Date(s);

  const trades = [
    { accountId: acc1.id, tradeDate: d("2026-04-28T08:30:00Z"), asset: "NAS100", direction: "buy", timeframe: "M15", higherTimeframeBias: "H4", entryTrigger: "MSS", setup: "OrderBlock", session: "london", entryPrice: 17450, stopLoss: 17400, takeProfit: 17550, riskPercent: 1, riskReward: 2, result: "win", pnl: 200, followedPlan: true, validSetup: true, riskRespected: true, impulsiveTrade: false, disciplineScore: 90, emotionBefore: "focused", emotionAfter: "calm", notes: "Clean MSS on M15 into HTF OB." },
    { accountId: acc1.id, tradeDate: d("2026-04-29T09:15:00Z"), asset: "NAS100", direction: "sell", timeframe: "M5", higherTimeframeBias: "H1", entryTrigger: "LiquiditySweep", setup: "FVG", session: "ny_open", entryPrice: 17600, stopLoss: 17650, takeProfit: 17450, riskPercent: 1.5, riskReward: 3, result: "win", pnl: 450, followedPlan: true, validSetup: true, riskRespected: true, impulsiveTrade: false, disciplineScore: 95, emotionBefore: "confident", emotionAfter: "calm", notes: "Liquidity sweep above NY high into FVG." },
    { accountId: acc1.id, tradeDate: d("2026-04-30T10:00:00Z"), asset: "EURUSD", direction: "buy", timeframe: "M15", higherTimeframeBias: "H4", entryTrigger: "BOS", setup: "BOS", session: "london", entryPrice: 1.0850, stopLoss: 1.0830, takeProfit: 1.0890, riskPercent: 1, riskReward: 2, result: "loss", pnl: -150, followedPlan: false, validSetup: false, riskRespected: true, impulsiveTrade: true, disciplineScore: 40, emotionBefore: "anxious", emotionAfter: "frustrated", notes: "Forced a trade. Lesson learned." },
    { accountId: acc1.id, tradeDate: d("2026-05-01T14:30:00Z"), asset: "NAS100", direction: "sell", timeframe: "M30", higherTimeframeBias: "Daily", entryTrigger: "OrderBlock", setup: "OrderBlock", session: "new_york", entryPrice: 17800, stopLoss: 17840, takeProfit: 17680, riskPercent: 1, riskReward: 3, result: "win", pnl: 360, followedPlan: true, validSetup: true, riskRespected: true, impulsiveTrade: false, disciplineScore: 92, emotionBefore: "focused", emotionAfter: "disciplined", notes: "HTF daily OB. Textbook SMC short." },
    { accountId: acc1.id, tradeDate: d("2026-05-02T09:00:00Z"), asset: "GBPUSD", direction: "buy", timeframe: "M15", higherTimeframeBias: "H4", entryTrigger: "FVG", setup: "FVG", session: "london_open", entryPrice: 1.2650, stopLoss: 1.2620, takeProfit: 1.2710, riskPercent: 0.5, riskReward: 2, result: "win", pnl: 175, followedPlan: true, validSetup: true, riskRespected: true, impulsiveTrade: false, disciplineScore: 88, emotionBefore: "confident", emotionAfter: "happy" },
    { accountId: acc1.id, tradeDate: d("2026-05-05T15:00:00Z"), asset: "NAS100", direction: "buy", timeframe: "M5", higherTimeframeBias: "H1", entryTrigger: "RejectionCandle", setup: "LiquiditySweep", session: "new_york", entryPrice: 17300, stopLoss: 17270, takeProfit: 17400, riskPercent: 1.5, riskReward: 3.3, result: "loss", pnl: -200, followedPlan: true, validSetup: true, riskRespected: true, impulsiveTrade: false, disciplineScore: 78, emotionBefore: "focused", emotionAfter: "calm", notes: "Good trade, stopped out." },
    { accountId: acc2.id, tradeDate: d("2026-05-01T08:00:00Z"), asset: "XAUUSD", direction: "buy", timeframe: "H1", higherTimeframeBias: "Daily", entryTrigger: "MSS", setup: "OrderBlock", session: "london", entryPrice: 2300, stopLoss: 2285, takeProfit: 2345, riskPercent: 1, riskReward: 3, result: "win", pnl: 1500, followedPlan: true, validSetup: true, riskRespected: true, impulsiveTrade: false, disciplineScore: 96, emotionBefore: "focused", emotionAfter: "disciplined", notes: "Gold HTF OB respected perfectly." },
    { accountId: acc2.id, tradeDate: d("2026-05-02T14:00:00Z"), asset: "XAUUSD", direction: "sell", timeframe: "M30", higherTimeframeBias: "H4", entryTrigger: "LiquiditySweep", setup: "FVG", session: "new_york", entryPrice: 2340, stopLoss: 2355, takeProfit: 2295, riskPercent: 1, riskReward: 3, result: "win", pnl: 1800, followedPlan: true, validSetup: true, riskRespected: true, impulsiveTrade: false, disciplineScore: 94 },
    { accountId: acc2.id, tradeDate: d("2026-05-05T10:00:00Z"), asset: "NAS100", direction: "buy", timeframe: "M15", higherTimeframeBias: "H4", entryTrigger: "CHOCH", setup: "CHOCH", session: "london", entryPrice: 17500, stopLoss: 17460, takeProfit: 17620, riskPercent: 0.5, riskReward: 3, result: "breakeven", pnl: 0, followedPlan: true, validSetup: true, riskRespected: true, impulsiveTrade: false, disciplineScore: 82 },
  ];

  await db.insert(tradesTable).values(trades as never[]);

  const acc1Pnl = trades.filter(t => t.accountId === acc1.id).reduce((s, t) => s + t.pnl, 0);
  const acc2Pnl = trades.filter(t => t.accountId === acc2.id).reduce((s, t) => s + t.pnl, 0);
  await db.update(accountsTable).set({ currentBalance: 10000 + acc1Pnl }).where(eq(accountsTable.id, acc1.id));
  await db.update(accountsTable).set({ currentBalance: 50000 + acc2Pnl }).where(eq(accountsTable.id, acc2.id));

  await db.insert(psychologyLogsTable).values([
    { accountId: acc1.id, logDate: d("2026-05-05T00:00:00Z"), emotionState: "focused", energyLevel: 8, stressLevel: 3, focusLevel: 9, tradedToday: true, followedRules: true, overallScore: 8, notes: "Great session today. Disciplined execution." },
    { accountId: acc1.id, logDate: d("2026-04-30T00:00:00Z"), emotionState: "anxious", energyLevel: 4, stressLevel: 8, focusLevel: 3, tradedToday: true, followedRules: false, overallScore: 4, notes: "Should have stayed out. Forced a bad trade." },
    { accountId: acc2.id, logDate: d("2026-05-05T00:00:00Z"), emotionState: "confident", energyLevel: 9, stressLevel: 2, focusLevel: 9, tradedToday: false, followedRules: true, overallScore: 9, notes: "Stayed patient. No trades today — no setups met criteria." },
  ] as never[]);

  console.log("Seed complete!");
  process.exit(0);
}

seed().catch(e => { console.error(e); process.exit(1); });
