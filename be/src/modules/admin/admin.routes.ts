import { Router } from "express";
import { authMiddleware, requireAdmin } from "../../middleware/auth-middleware.js";
import {
  getAdminActivityLogsHandler,
  deleteAdminGroupHandler,
  getAdminDashboardHandler,
  getAdminGroupByIdHandler,
  getAdminGroupsHandler,
  getAdminRejectedHandler,
  getAdminSessionHandler,
  getAdminUploadsHandler,
} from "./admin.controller.js";

const adminRouter = Router();

adminRouter.get("/dashboard", authMiddleware, requireAdmin, getAdminDashboardHandler);
adminRouter.get("/groups", authMiddleware, requireAdmin, getAdminGroupsHandler);
adminRouter.get("/groups/:groupId", authMiddleware, requireAdmin, getAdminGroupByIdHandler);
adminRouter.delete("/groups/:groupId", authMiddleware, requireAdmin, deleteAdminGroupHandler);
adminRouter.get("/uploads", authMiddleware, requireAdmin, getAdminUploadsHandler);
adminRouter.get("/rejected", authMiddleware, requireAdmin, getAdminRejectedHandler);
adminRouter.get("/activity", authMiddleware, requireAdmin, getAdminActivityLogsHandler);
adminRouter.get("/session", authMiddleware, requireAdmin, getAdminSessionHandler);

export default adminRouter;
