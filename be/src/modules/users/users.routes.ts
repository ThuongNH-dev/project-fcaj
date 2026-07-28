import { Router } from "express";
import { authMiddleware } from "../../middleware/auth-middleware.js";
import {
  changeCurrentUserPasswordHandler,
  deleteCurrentUserHandler,
  getCurrentUserBillingHistoryHandler,
  getCurrentUserBillingHandler,
  getCurrentUserHandler,
  updateCurrentUserHandler,
  updateCurrentUserBillingHandler,
  updateCurrentUserBillingAutoRenewHandler,
} from "./users.controller.js";

const usersRouter = Router();

usersRouter.get("/me", authMiddleware, getCurrentUserHandler);
usersRouter.patch("/me", authMiddleware, updateCurrentUserHandler);
usersRouter.delete("/me", authMiddleware, deleteCurrentUserHandler);
usersRouter.get("/me/billing", authMiddleware, getCurrentUserBillingHandler);
usersRouter.get("/me/billing/history", authMiddleware, getCurrentUserBillingHistoryHandler);
usersRouter.patch("/me/billing", authMiddleware, updateCurrentUserBillingHandler);
usersRouter.patch(
  "/me/billing/auto-renew",
  authMiddleware,
  updateCurrentUserBillingAutoRenewHandler,
);
usersRouter.patch("/me/password", authMiddleware, changeCurrentUserPasswordHandler);
export default usersRouter;
