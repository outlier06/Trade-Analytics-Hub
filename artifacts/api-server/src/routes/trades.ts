import { Router, type IRouter } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db, tradesTable } from "@workspace/db";
import {
  CreateTradeBody,
  UpdateTradeBody,
  GetTradeParams,
  UpdateTradeParams,
  DeleteTradeParams,
  ListTradesQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/trades", async (req, res): Promise<void> => {
  const query = ListTradesQueryParams.safeParse(req.query);
  if (!query.success) { res.status(400).json({ error: query.error.message }); return; }
  const { accountId, result, session, setup, timeframe, entryTrigger, asset, strategy, limit, offset } = query.data;

  const conditions = [];
  if (accountId) conditions.push(eq(tradesTable.accountId, accountId));
  if (result) conditions.push(eq(tradesTable.result, result));
  if (session) conditions.push(eq(tradesTable.session, session));
  if (setup) conditions.push(eq(tradesTable.setup, setup));
  if (timeframe) conditions.push(eq(tradesTable.timeframe, timeframe));
  if (entryTrigger) conditions.push(eq(tradesTable.entryTrigger, entryTrigger));
  if (asset) conditions.push(eq(tradesTable.asset, asset));
  if (strategy) conditions.push(eq(tradesTable.strategy, strategy));

  let q = db.select().from(tradesTable).orderBy(desc(tradesTable.tradeDate));
  if (conditions.length > 0) {
    q = q.where(and(...conditions)) as typeof q;
  }
  if (limit) q = q.limit(limit) as typeof q;
  if (offset) q = q.offset(offset) as typeof q;

  const trades = await q;
  res.json(trades);
});

router.post("/trades", async (req, res): Promise<void> => {
  const parsed = CreateTradeBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [trade] = await db.insert(tradesTable).values(parsed.data as Parameters<typeof db.insert>[0] extends { values: infer V } ? V : never).returning();
  res.status(201).json(trade);
});

router.get("/trades/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = GetTradeParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const [trade] = await db.select().from(tradesTable).where(eq(tradesTable.id, params.data.id));
  if (!trade) { res.status(404).json({ error: "Trade not found" }); return; }
  res.json(trade);
});

router.patch("/trades/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdateTradeParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdateTradeBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const updateData: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v !== undefined) updateData[k] = v;
  }
  const [trade] = await db.update(tradesTable).set(updateData).where(eq(tradesTable.id, params.data.id)).returning();
  if (!trade) { res.status(404).json({ error: "Trade not found" }); return; }
  res.json(trade);
});

router.delete("/trades/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeleteTradeParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  await db.delete(tradesTable).where(eq(tradesTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
