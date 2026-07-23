import { Router } from "express";
import adminRouter from "../modules/admin/admin.routes.js";
import authRouter from "../modules/auth/auth.routes.js";
import expensesRouter from "../modules/expenses/expenses.routes.js";
import groupsRouter from "../modules/groups/groups.routes.js";
import notificationsRouter from "../modules/notifications/notifications.routes.js";
import receiptsRouter from "../modules/receipts/receipts.routes.js";
import settlementsRouter from "../modules/settlements/settlements.routes.js";
import systemRouter from "../modules/system/system.routes.js";
import usersRouter from "../modules/users/users.routes.js";

const apiRouter = Router();

apiRouter.use(systemRouter);
apiRouter.use("/api/admin", adminRouter);
apiRouter.use("/api/auth", authRouter);
apiRouter.use("/api/expenses", expensesRouter);
apiRouter.use("/api/groups", groupsRouter);
apiRouter.use("/api/notifications", notificationsRouter);
apiRouter.use("/api/receipts", receiptsRouter);
apiRouter.use("/api/settlements", settlementsRouter);
apiRouter.use("/api/users", usersRouter);

export default apiRouter;
