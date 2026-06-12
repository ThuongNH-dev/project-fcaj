import { Router } from "express";
import authRouter from "../modules/auth/auth.routes.js";
import groupsRouter from "../modules/groups/groups.routes.js";
import systemRouter from "../modules/system/system.routes.js";
import usersRouter from "../modules/users/users.routes.js";

const apiRouter = Router();

apiRouter.use(systemRouter);
apiRouter.use("/api/auth", authRouter);
apiRouter.use("/api/groups", groupsRouter);
apiRouter.use("/api/users", usersRouter);

export default apiRouter;
