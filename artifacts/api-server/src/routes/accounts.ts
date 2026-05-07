import { Router, type IRouter } from "express";
import { eq, desc } from "drizzle-orm";
import { db, accountsTable, tradesTable } from "@workspace/db";
import {
  CreateAccountBody,
  UpdateAccountBody,
  GetAccountParams,
  UpdateAccountParams,
  DeleteAccountParams,
  GetAccountStatsParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/accounts", async (_req, res): Promise<void> => {
  const accounts = await db.select().from(accountsTable).orderBy(desc(accountsTable.createdAt));
  res.json(accounts);
});

router.post("/accounts", async (req, res): Promise<void> => {
  const parsed = CreateAccountBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [account] = await db.insert(accountsTable).values(parsed.data).returning();
  res.status(201).json(account);
});

router.get("/accounts/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetAccountParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [account] = await db.select().from(accountsTable).where(eq(accountsTable.id, params.data.id));
  if (!account) { res.status(404).json({ error: "Account not found" }); return; }
  res.json(account);
});

router.patch("/accounts/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateAccountParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateAccountBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const updateData: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v !== null && v !== undefined) updateData[k] = v;
  }
  const [account] = await db.update(accountsTable).set(updateData).where(eq(accountsTable.id, params.data.id)).returning();
  if (!account) { res.status(404).json({ error: "Account not found" }); return; }
  res.json(account);
});

router.delete("/accounts/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteAccountParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  await db.delete(accountsTable).where(eq(accountsTable.id, params.data.id));
  res.sendStatus(204);
});

router.get("/accounts/:id/stats", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetAccountStatsParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const trades = await db.select().from(tradesTable).where(eq(tradesTable.accountId, params.data.id));

  const wins = trades.filter(t => t.result === "win");
  const losses = trades.filter(t => t.result === "loss");
  const total = trades.length;
  const winRate = total > 0 ? (wins.length / total) * 100 : 0;
  const totalPnl = trades.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const avgWin = wins.length > 0 ? wins.reduce((s, t) => s + (t.pnl ?? 0), 0) / wins.length : 0;
  const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, t) => s + (t.pnl ?? 0), 0) / losses.length) : 0;
  const grossWins = wins.reduce((s, t) => s + (t.pnl ?? 0), 0);
  const grossLosses = Math.abs(losses.reduce((s, t) => s + (t.pnl ?? 0), 0));
  const profitFactor = grossLosses > 0 ? grossWins / grossLosses : grossWins > 0 ? 999 : 0;
  const avgRR = trades.filter(t => t.riskReward).reduce((s, t) => s + (t.riskReward ?? 0), 0) / (trades.filter(t => t.riskReward).length || 1);

  let runningBalance = 0;
  let maxDrawdown = 0;
  let peak = 0;
  for (const t of trades.sort((a, b) => new Date(a.tradeDate).getTime() - new Date(b.tradeDate).getTime())) {
    runningBalance += (t.pnl ?? 0);
    if (runningBalance > peak) peak = runningBalance;
    const dd = peak - runningBalance;
    if (dd > maxDrawdown) maxDrawdown = dd;
  }

  const disciplinedTrades = trades.filter(t => t.followedPlan && t.validSetup && t.riskRespected);
  const disciplineScore = total > 0 ? (disciplinedTrades.length / total) * 100 : 100;

  const sessionCounts: Record<string, { wins: number; total: number }> = {};
  for (const t of trades) {
    if (t.session) {
      if (!sessionCounts[t.session]) sessionCounts[t.session] = { wins: 0, total: 0 };
      sessionCounts[t.session].total++;
      if (t.result === "win") sessionCounts[t.session].wins++;
    }
  }
  const bestSession = Object.entries(sessionCounts).sort((a, b) => (b[1].wins / b[1].total) - (a[1].wins / a[1].total))[0]?.[0] ?? null;

  const setupCounts: Record<string, { wins: number; total: number }> = {};
  for (const t of trades) {
    if (t.setup) {
      if (!setupCounts[t.setup]) setupCounts[t.setup] = { wins: 0, total: 0 };
      setupCounts[t.setup].total++;
      if (t.result === "win") setupCounts[t.setup].wins++;
    }
  }
  const bestSetup = Object.entries(setupCounts).sort((a, b) => (b[1].wins / b[1].total) - (a[1].wins / a[1].total))[0]?.[0] ?? null;

  const tfCounts: Record<string, { wins: number; total: number }> = {};
  for (const t of trades) {
    if (t.timeframe) {
      if (!tfCounts[t.timeframe]) tfCounts[t.timeframe] = { wins: 0, total: 0 };
      tfCounts[t.timeframe].total++;
      if (t.result === "win") tfCounts[t.timeframe].wins++;
    }
  }
  const bestTimeframe = Object.entries(tfCounts).sort((a, b) => (b[1].wins / b[1].total) - (a[1].wins / a[1].total))[0]?.[0] ?? null;

  const consistencyScore = Math.min(100, Math.max(0, winRate * 0.5 + disciplineScore * 0.5));

  res.json({
    accountId: params.data.id,
    totalTrades: total,
    wins: wins.length,
    losses: losses.length,
    breakevens: trades.filter(t => t.result === "breakeven").length,
    winRate,
    totalPnl,
    averageWin: avgWin,
    averageLoss: avgLoss,
    profitFactor,
    averageRR: avgRR,
    maxDrawdown,
    disciplineScore,
    consistencyScore,
    bestSession,
    bestSetup,
    bestTimeframe,
  });
});

export default router;
