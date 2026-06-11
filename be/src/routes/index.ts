import { Router } from "express";
import authRouter from "../modules/auth/auth.routes.js";
import systemRouter from "../modules/system/system.routes.js";

const apiRouter = Router();

apiRouter.use(systemRouter);
apiRouter.use("/api/auth", authRouter);

export default apiRouter;
