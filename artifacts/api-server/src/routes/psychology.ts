import { Router, type IRouter } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db, psychologyLogsTable } from "@workspace/db";
import {
  CreatePsychologyLogBody,
  UpdatePsychologyLogBody,
  UpdatePsychologyLogParams,
  DeletePsychologyLogParams,
  ListPsychologyLogsQueryParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/psychology", async (req, res): Promise<void> => {
  const query = ListPsychologyLogsQueryParams.safeParse(req.query);
  if (!query.success) { res.status(400).json({ error: query.error.message }); return; }
  const conditions = [];
  if (query.data.accountId) conditions.push(eq(psychologyLogsTable.accountId, query.data.accountId));
  let q = db.select().from(psychologyLogsTable).orderBy(desc(psychologyLogsTable.logDate));
  if (conditions.length > 0) q = q.where(and(...conditions)) as typeof q;
  const logs = await q;
  res.json(logs);
});

router.post("/psychology", async (req, res): Promise<void> => {
  const parsed = CreatePsychologyLogBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const [log] = await db.insert(psychologyLogsTable).values(parsed.data as Parameters<typeof db.insert>[0] extends { values: infer V } ? V : never).returning();
  res.status(201).json(log);
});

router.patch("/psychology/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = UpdatePsychologyLogParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  const parsed = UpdatePsychologyLogBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }
  const updateData: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data)) {
    if (v !== undefined) updateData[k] = v;
  }
  const [log] = await db.update(psychologyLogsTable).set(updateData).where(eq(psychologyLogsTable.id, params.data.id)).returning();
  if (!log) { res.status(404).json({ error: "Log not found" }); return; }
  res.json(log);
});

router.delete("/psychology/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = DeletePsychologyLogParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) { res.status(400).json({ error: params.error.message }); return; }
  await db.delete(psychologyLogsTable).where(eq(psychologyLogsTable.id, params.data.id));
  res.sendStatus(204);
});

export default router;
