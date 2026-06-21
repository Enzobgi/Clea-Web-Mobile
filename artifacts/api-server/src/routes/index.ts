import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import dataRouter from "./data";
import chatRouter from "./chat";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(dataRouter);
router.use(chatRouter);

export default router;
