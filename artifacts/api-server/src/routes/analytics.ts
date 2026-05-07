import { Router, type IRouter } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db, accountsTable, tradesTable } from "@workspace/db";
import {
  GetTimeframeAnalyticsQueryParams,
  GetTriggerAnalyticsQueryParams,
  GetSessionAnalyticsQueryParams,
  GetSetupAnalyticsQueryParams,
  GetEquityCurveQueryParams,
  GetRecentTradesQueryParams,
  GetCombinationAnalyticsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/analytics/dashboard", async (_req, res): Promise<void> => {
  const accounts = await db.select().from(accountsTable);
  const trades = await db.select().from(tradesTable);

  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const wins = trades.filter(t => t.result === "win");
  const losses = trades.filter(t => t.result === "loss");
  const total = trades.length;
  const overallWinRate = total > 0 ? (wins.length / total) * 100 : 0;
  const totalPnl = trades.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const totalPnlToday = trades.filter(t => new Date(t.tradeDate) >= todayStart).reduce((s, t) => s + (t.pnl ?? 0), 0);
  const totalPnlThisWeek = trades.filter(t => new Date(t.tradeDate) >= weekStart).reduce((s, t) => s + (t.pnl ?? 0), 0);
  const totalPnlThisMonth = trades.filter(t => new Date(t.tradeDate) >= monthStart).reduce((s, t) => s + (t.pnl ?? 0), 0);

  const disciplinedTrades = trades.filter(t => t.followedPlan && t.validSetup && t.riskRespected);
  const avgDiscipline = total > 0 ? (disciplinedTrades.length / total) * 100 : 100;

  const accountBreakdown = accounts.map(acc => {
    const accTrades = trades.filter(t => t.accountId === acc.id);
    const accWins = accTrades.filter(t => t.result === "win");
    const wr = accTrades.length > 0 ? (accWins.length / accTrades.length) * 100 : 0;
    const pnl = accTrades.reduce((s, t) => s + (t.pnl ?? 0), 0);
    return { accountId: acc.id, accountName: acc.name, winRate: wr, totalPnl: pnl, totalTrades: accTrades.length, status: acc.status };
  });

  const bestAccountEntry = accountBreakdown.sort((a, b) => b.totalPnl - a.totalPnl)[0];
  const worstAccountEntry = [...accountBreakdown].sort((a, b) => a.totalPnl - b.totalPnl)[0];

  const sessionMap: Record<string, { w: number; t: number; pnl: number }> = {};
  const setupMap: Record<string, { w: number; t: number; pnl: number }> = {};
  const tfMap: Record<string, { w: number; t: number; pnl: number }> = {};
  const triggerMap: Record<string, { w: number; t: number; pnl: number }> = {};

  for (const t of trades) {
    if (t.session) {
      sessionMap[t.session] ??= { w: 0, t: 0, pnl: 0 };
      sessionMap[t.session].t++;
      sessionMap[t.session].pnl += t.pnl ?? 0;
      if (t.result === "win") sessionMap[t.session].w++;
    }
    if (t.setup) {
      setupMap[t.setup] ??= { w: 0, t: 0, pnl: 0 };
      setupMap[t.setup].t++;
      setupMap[t.setup].pnl += t.pnl ?? 0;
      if (t.result === "win") setupMap[t.setup].w++;
    }
    if (t.timeframe) {
      tfMap[t.timeframe] ??= { w: 0, t: 0, pnl: 0 };
      tfMap[t.timeframe].t++;
      tfMap[t.timeframe].pnl += t.pnl ?? 0;
      if (t.result === "win") tfMap[t.timeframe].w++;
    }
    if (t.entryTrigger) {
      triggerMap[t.entryTrigger] ??= { w: 0, t: 0, pnl: 0 };
      triggerMap[t.entryTrigger].t++;
      triggerMap[t.entryTrigger].pnl += t.pnl ?? 0;
      if (t.result === "win") triggerMap[t.entryTrigger].w++;
    }
  }

  const bestSession = Object.entries(sessionMap).sort((a, b) => b[1].pnl - a[1].pnl)[0]?.[0] ?? null;
  const bestSetup = Object.entries(setupMap).sort((a, b) => b[1].pnl - a[1].pnl)[0]?.[0] ?? null;
  const bestTimeframe = Object.entries(tfMap).sort((a, b) => b[1].pnl - a[1].pnl)[0]?.[0] ?? null;
  const bestTrigger = Object.entries(triggerMap).sort((a, b) => b[1].pnl - a[1].pnl)[0]?.[0] ?? null;

  res.json({
    totalAccounts: accounts.length,
    totalTrades: total,
    overallWinRate,
    totalPnl,
    totalPnlToday,
    totalPnlThisWeek,
    totalPnlThisMonth,
    bestAccount: bestAccountEntry?.accountName ?? null,
    worstAccount: worstAccountEntry?.accountName ?? null,
    averageDisciplineScore: avgDiscipline,
    totalWins: wins.length,
    totalLosses: losses.length,
    bestSetup,
    bestSession,
    bestTimeframe,
    bestTrigger,
    activeAccounts: accounts.filter(a => a.status === "active").length,
    accountBreakdown,
  });
});

router.get("/analytics/timeframes", async (req, res): Promise<void> => {
  const query = GetTimeframeAnalyticsQueryParams.safeParse(req.query);
  if (!query.success) { res.status(400).json({ error: query.error.message }); return; }
  const conditions = [];
  if (query.data.accountId) conditions.push(eq(tradesTable.accountId, query.data.accountId));
  let q = db.select().from(tradesTable);
  if (conditions.length > 0) q = q.where(and(...conditions)) as typeof q;
  const trades = await q;

  const map: Record<string, { wins: number; losses: number; total: number; pnl: number; rrSum: number; rrCount: number; winPnl: number; lossPnl: number }> = {};
  for (const t of trades) {
    const tf = t.timeframe ?? "Unknown";
    map[tf] ??= { wins: 0, losses: 0, total: 0, pnl: 0, rrSum: 0, rrCount: 0, winPnl: 0, lossPnl: 0 };
    map[tf].total++;
    map[tf].pnl += t.pnl ?? 0;
    if (t.result === "win") { map[tf].wins++; map[tf].winPnl += t.pnl ?? 0; }
    if (t.result === "loss") { map[tf].losses++; map[tf].lossPnl += Math.abs(t.pnl ?? 0); }
    if (t.riskReward) { map[tf].rrSum += t.riskReward; map[tf].rrCount++; }
  }

  const result = Object.entries(map).map(([timeframe, d]) => ({
    timeframe,
    totalTrades: d.total,
    wins: d.wins,
    losses: d.losses,
    winRate: d.total > 0 ? (d.wins / d.total) * 100 : 0,
    totalPnl: d.pnl,
    averageRR: d.rrCount > 0 ? d.rrSum / d.rrCount : 0,
    averageWin: d.wins > 0 ? d.winPnl / d.wins : 0,
    averageLoss: d.losses > 0 ? d.lossPnl / d.losses : 0,
    profitFactor: d.lossPnl > 0 ? d.winPnl / d.lossPnl : d.winPnl > 0 ? 999 : 0,
  })).sort((a, b) => b.totalPnl - a.totalPnl);

  res.json(result);
});

router.get("/analytics/triggers", async (req, res): Promise<void> => {
  const query = GetTriggerAnalyticsQueryParams.safeParse(req.query);
  if (!query.success) { res.status(400).json({ error: query.error.message }); return; }
  const conditions = [];
  if (query.data.accountId) conditions.push(eq(tradesTable.accountId, query.data.accountId));
  let q = db.select().from(tradesTable);
  if (conditions.length > 0) q = q.where(and(...conditions)) as typeof q;
  const trades = await q;

  const map: Record<string, { wins: number; losses: number; total: number; pnl: number; rrSum: number; rrCount: number; winPnl: number; lossPnl: number }> = {};
  for (const t of trades) {
    const key = t.entryTrigger ?? "Unknown";
    map[key] ??= { wins: 0, losses: 0, total: 0, pnl: 0, rrSum: 0, rrCount: 0, winPnl: 0, lossPnl: 0 };
    map[key].total++;
    map[key].pnl += t.pnl ?? 0;
    if (t.result === "win") { map[key].wins++; map[key].winPnl += t.pnl ?? 0; }
    if (t.result === "loss") { map[key].losses++; map[key].lossPnl += Math.abs(t.pnl ?? 0); }
    if (t.riskReward) { map[key].rrSum += t.riskReward; map[key].rrCount++; }
  }

  const result = Object.entries(map).map(([entryTrigger, d]) => ({
    entryTrigger,
    totalTrades: d.total,
    wins: d.wins,
    losses: d.losses,
    winRate: d.total > 0 ? (d.wins / d.total) * 100 : 0,
    totalPnl: d.pnl,
    averageRR: d.rrCount > 0 ? d.rrSum / d.rrCount : 0,
    profitFactor: d.lossPnl > 0 ? d.winPnl / d.lossPnl : d.winPnl > 0 ? 999 : 0,
  })).sort((a, b) => b.totalPnl - a.totalPnl);

  res.json(result);
});

router.get("/analytics/sessions", async (req, res): Promise<void> => {
  const query = GetSessionAnalyticsQueryParams.safeParse(req.query);
  if (!query.success) { res.status(400).json({ error: query.error.message }); return; }
  const conditions = [];
  if (query.data.accountId) conditions.push(eq(tradesTable.accountId, query.data.accountId));
  let q = db.select().from(tradesTable);
  if (conditions.length > 0) q = q.where(and(...conditions)) as typeof q;
  const trades = await q;

  const map: Record<string, { wins: number; losses: number; total: number; pnl: number; rrSum: number; rrCount: number; winPnl: number; lossPnl: number }> = {};
  for (const t of trades) {
    const key = t.session ?? "Unknown";
    map[key] ??= { wins: 0, losses: 0, total: 0, pnl: 0, rrSum: 0, rrCount: 0, winPnl: 0, lossPnl: 0 };
    map[key].total++;
    map[key].pnl += t.pnl ?? 0;
    if (t.result === "win") { map[key].wins++; map[key].winPnl += t.pnl ?? 0; }
    if (t.result === "loss") { map[key].losses++; map[key].lossPnl += Math.abs(t.pnl ?? 0); }
    if (t.riskReward) { map[key].rrSum += t.riskReward; map[key].rrCount++; }
  }

  const result = Object.entries(map).map(([session, d]) => ({
    session,
    totalTrades: d.total,
    wins: d.wins,
    losses: d.losses,
    winRate: d.total > 0 ? (d.wins / d.total) * 100 : 0,
    totalPnl: d.pnl,
    averageRR: d.rrCount > 0 ? d.rrSum / d.rrCount : 0,
    profitFactor: d.lossPnl > 0 ? d.winPnl / d.lossPnl : d.winPnl > 0 ? 999 : 0,
  })).sort((a, b) => b.totalPnl - a.totalPnl);

  res.json(result);
});

router.get("/analytics/setups", async (req, res): Promise<void> => {
  const query = GetSetupAnalyticsQueryParams.safeParse(req.query);
  if (!query.success) { res.status(400).json({ error: query.error.message }); return; }
  const conditions = [];
  if (query.data.accountId) conditions.push(eq(tradesTable.accountId, query.data.accountId));
  let q = db.select().from(tradesTable);
  if (conditions.length > 0) q = q.where(and(...conditions)) as typeof q;
  const trades = await q;

  const map: Record<string, { wins: number; losses: number; total: number; pnl: number; rrSum: number; rrCount: number; winPnl: number; lossPnl: number }> = {};
  for (const t of trades) {
    const key = t.setup ?? "Unknown";
    map[key] ??= { wins: 0, losses: 0, total: 0, pnl: 0, rrSum: 0, rrCount: 0, winPnl: 0, lossPnl: 0 };
    map[key].total++;
    map[key].pnl += t.pnl ?? 0;
    if (t.result === "win") { map[key].wins++; map[key].winPnl += t.pnl ?? 0; }
    if (t.result === "loss") { map[key].losses++; map[key].lossPnl += Math.abs(t.pnl ?? 0); }
    if (t.riskReward) { map[key].rrSum += t.riskReward; map[key].rrCount++; }
  }

  const result = Object.entries(map).map(([setup, d]) => ({
    setup,
    totalTrades: d.total,
    wins: d.wins,
    losses: d.losses,
    winRate: d.total > 0 ? (d.wins / d.total) * 100 : 0,
    totalPnl: d.pnl,
    averageRR: d.rrCount > 0 ? d.rrSum / d.rrCount : 0,
    profitFactor: d.lossPnl > 0 ? d.winPnl / d.lossPnl : d.winPnl > 0 ? 999 : 0,
  })).sort((a, b) => b.totalPnl - a.totalPnl);

  res.json(result);
});

router.get("/analytics/equity-curve", async (req, res): Promise<void> => {
  const query = GetEquityCurveQueryParams.safeParse(req.query);
  if (!query.success) { res.status(400).json({ error: query.error.message }); return; }
  const [account] = await db.select().from(accountsTable).where(eq(accountsTable.id, query.data.accountId));
  if (!account) { res.status(404).json({ error: "Account not found" }); return; }
  const trades = await db.select().from(tradesTable)
    .where(eq(tradesTable.accountId, query.data.accountId))
    .orderBy(tradesTable.tradeDate);

  let balance = account.initialBalance;
  const points = [{ date: account.createdAt.toISOString(), balance, pnl: 0, tradeId: null }];
  for (const t of trades) {
    balance += t.pnl ?? 0;
    points.push({ date: new Date(t.tradeDate).toISOString(), balance, pnl: t.pnl ?? 0, tradeId: t.id });
  }
  res.json(points);
});

router.get("/analytics/recent-trades", async (req, res): Promise<void> => {
  const query = GetRecentTradesQueryParams.safeParse(req.query);
  if (!query.success) { res.status(400).json({ error: query.error.message }); return; }
  const limit = query.data.limit ?? 10;
  const trades = await db.select().from(tradesTable).orderBy(desc(tradesTable.tradeDate)).limit(limit);
  res.json(trades);
});

router.get("/analytics/combinations", async (req, res): Promise<void> => {
  const query = GetCombinationAnalyticsQueryParams.safeParse(req.query);
  if (!query.success) { res.status(400).json({ error: query.error.message }); return; }
  const conditions = [];
  if (query.data.accountId) conditions.push(eq(tradesTable.accountId, query.data.accountId));
  let q = db.select().from(tradesTable);
  if (conditions.length > 0) q = q.where(and(...conditions)) as typeof q;
  const trades = await q;

  const map: Record<string, { wins: number; losses: number; total: number; pnl: number; rrSum: number; rrCount: number; winPnl: number; lossPnl: number; tf: string | null; trigger: string | null; setup: string | null }> = {};
  for (const t of trades) {
    const key = `${t.timeframe ?? ""}|${t.entryTrigger ?? ""}|${t.setup ?? ""}`;
    map[key] ??= { wins: 0, losses: 0, total: 0, pnl: 0, rrSum: 0, rrCount: 0, winPnl: 0, lossPnl: 0, tf: t.timeframe ?? null, trigger: t.entryTrigger ?? null, setup: t.setup ?? null };
    map[key].total++;
    map[key].pnl += t.pnl ?? 0;
    if (t.result === "win") { map[key].wins++; map[key].winPnl += t.pnl ?? 0; }
    if (t.result === "loss") { map[key].losses++; map[key].lossPnl += Math.abs(t.pnl ?? 0); }
    if (t.riskReward) { map[key].rrSum += t.riskReward; map[key].rrCount++; }
  }

  const result = Object.values(map)
    .filter(d => d.total >= 2)
    .map(d => ({
      timeframe: d.tf,
      entryTrigger: d.trigger,
      setup: d.setup,
      totalTrades: d.total,
      winRate: d.total > 0 ? (d.wins / d.total) * 100 : 0,
      totalPnl: d.pnl,
      averageRR: d.rrCount > 0 ? d.rrSum / d.rrCount : 0,
      profitFactor: d.lossPnl > 0 ? d.winPnl / d.lossPnl : d.winPnl > 0 ? 999 : 0,
    }))
    .sort((a, b) => b.totalPnl - a.totalPnl)
    .slice(0, 20);

  res.json(result);
});

export default router;
