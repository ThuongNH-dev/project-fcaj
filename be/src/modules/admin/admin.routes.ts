import { Router } from "express";
import { authMiddleware, requireAdmin } from "../../middleware/auth-middleware.js";
import {
  getAdminActivityLogsHandler,
  deleteAdminUserHandler,
  deleteAdminGroupHandler,
  exportAdminUsersHandler,
  getAdminDashboardHandler,
  getAdminGroupByIdHandler,
  getAdminGroupsHandler,
  getAdminRejectedHandler,
  getAdminSettlementByIdHandler,
  getAdminSettlementsHandler,
  getAdminSessionHandler,
  getAdminUploadViewUrlHandler,
  getAdminUploadsHandler,
  getAdminUserByIdHandler,
  getAdminUsersHandler,
  reviewAdminUploadHandler,
  updateAdminGroupBanHandler,
  updateAdminUserBanHandler,
  updateAdminUserRoleHandler,
  sendProductUpdateHandler,
} from "./admin.controller.js";

const adminRouter = Router();

adminRouter.get("/dashboard", authMiddleware, requireAdmin, getAdminDashboardHandler);
adminRouter.get("/users/export", authMiddleware, requireAdmin, exportAdminUsersHandler);
adminRouter.get("/users", authMiddleware, requireAdmin, getAdminUsersHandler);
adminRouter.get("/users/:userId", authMiddleware, requireAdmin, getAdminUserByIdHandler);
adminRouter.patch("/users/:userId", authMiddleware, requireAdmin, updateAdminUserRoleHandler);
adminRouter.patch("/users/:userId/ban", authMiddleware, requireAdmin, updateAdminUserBanHandler);
adminRouter.delete("/users/:userId", authMiddleware, requireAdmin, deleteAdminUserHandler);
adminRouter.get("/groups", authMiddleware, requireAdmin, getAdminGroupsHandler);
adminRouter.get("/groups/:groupId", authMiddleware, requireAdmin, getAdminGroupByIdHandler);
adminRouter.patch("/groups/:groupId/ban", authMiddleware, requireAdmin, updateAdminGroupBanHandler);
adminRouter.delete("/groups/:groupId", authMiddleware, requireAdmin, deleteAdminGroupHandler);
adminRouter.get("/uploads", authMiddleware, requireAdmin, getAdminUploadsHandler);
adminRouter.get("/uploads/:receiptId/view-url", authMiddleware, requireAdmin, getAdminUploadViewUrlHandler);
adminRouter.patch("/uploads/:receiptId/review", authMiddleware, requireAdmin, reviewAdminUploadHandler);
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
adminRouter.post(
  "/notifications/product-update",
  authMiddleware,
  requireAdmin,
  sendProductUpdateHandler,
);

export default adminRouter;
