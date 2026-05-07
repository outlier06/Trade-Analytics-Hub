import { Router, type IRouter } from "express";
import healthRouter from "./health";
import accountsRouter from "./accounts";
import tradesRouter from "./trades";
import psychologyRouter from "./psychology";
import analyticsRouter from "./analytics";

const router: IRouter = Router();

router.use(healthRouter);
router.use(accountsRouter);
router.use(tradesRouter);
router.use(psychologyRouter);
router.use(analyticsRouter);

export default router;
