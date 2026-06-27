import { Router } from "express";
import { authMiddleware, requireAdmin } from "../../middleware/auth-middleware.js";
import {
  getAdminActivityLogsHandler,
  deleteAdminUserHandler,
  deleteAdminGroupHandler,
  getAdminDashboardHandler,
  getAdminGroupByIdHandler,
  getAdminGroupsHandler,
  getAdminRejectedHandler,
  getAdminSettlementByIdHandler,
  getAdminSettlementsHandler,
  getAdminSessionHandler,
  getAdminUploadsHandler,
  getAdminUserByIdHandler,
  getAdminUsersHandler,
  updateAdminUserRoleHandler,
} from "./admin.controller.js";

const adminRouter = Router();

adminRouter.get("/dashboard", authMiddleware, requireAdmin, getAdminDashboardHandler);
adminRouter.get("/users", authMiddleware, requireAdmin, getAdminUsersHandler);
adminRouter.get("/users/:userId", authMiddleware, requireAdmin, getAdminUserByIdHandler);
adminRouter.patch("/users/:userId", authMiddleware, requireAdmin, updateAdminUserRoleHandler);
adminRouter.delete("/users/:userId", authMiddleware, requireAdmin, deleteAdminUserHandler);
adminRouter.get("/groups", authMiddleware, requireAdmin, getAdminGroupsHandler);
adminRouter.get("/groups/:groupId", authMiddleware, requireAdmin, getAdminGroupByIdHandler);
adminRouter.delete("/groups/:groupId", authMiddleware, requireAdmin, deleteAdminGroupHandler);
adminRouter.get("/uploads", authMiddleware, requireAdmin, getAdminUploadsHandler);
adminRouter.get("/rejected", authMiddleware, requireAdmin, getAdminRejectedHandler);
adminRouter.get("/settlements", authMiddleware, requireAdmin, getAdminSettlementsHandler);
adminRouter.get(
  "/settlements/:expenseId",
  authMiddleware,
  requireAdmin,
  getAdminSettlementByIdHandler,
);
adminRouter.get("/activity", authMiddleware, requireAdmin, getAdminActivityLogsHandler);
adminRouter.get("/session", authMiddleware, requireAdmin, getAdminSessionHandler);

export default adminRouter;
