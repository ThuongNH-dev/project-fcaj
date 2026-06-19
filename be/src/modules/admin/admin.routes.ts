import { Router } from "express";
import { authMiddleware, requireAdmin } from "../../middleware/auth-middleware.js";
import {
  getAdminDashboardHandler,
  getAdminSessionHandler,
} from "./admin.controller.js";

const adminRouter = Router();

adminRouter.get("/dashboard", authMiddleware, requireAdmin, getAdminDashboardHandler);
adminRouter.get("/session", authMiddleware, requireAdmin, getAdminSessionHandler);

export default adminRouter;
