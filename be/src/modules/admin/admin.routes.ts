import { Router } from "express";
import { authMiddleware, requireAdmin } from "../../middleware/auth-middleware.js";
import {
  deleteAdminGroupHandler,
  getAdminDashboardHandler,
  getAdminGroupByIdHandler,
  getAdminGroupsHandler,
  getAdminSessionHandler,
} from "./admin.controller.js";

const adminRouter = Router();

adminRouter.get("/dashboard", authMiddleware, requireAdmin, getAdminDashboardHandler);
adminRouter.get("/groups", authMiddleware, requireAdmin, getAdminGroupsHandler);
adminRouter.get("/groups/:groupId", authMiddleware, requireAdmin, getAdminGroupByIdHandler);
adminRouter.delete("/groups/:groupId", authMiddleware, requireAdmin, deleteAdminGroupHandler);
adminRouter.get("/session", authMiddleware, requireAdmin, getAdminSessionHandler);

export default adminRouter;
