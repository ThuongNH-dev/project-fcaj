import { Router } from "express";
import { authMiddleware } from "../../middleware/auth-middleware.js";
import {
  changeCurrentUserPasswordHandler,
  deleteCurrentUserHandler,
  deleteCurrentUserPaymentMethodHandler,
  getCurrentUserBillingHandler,
  getCurrentUserHandler,
  getCurrentUserNotificationPreferencesHandler,
  getCurrentUserPaymentMethodHandler,
  updateCurrentUserHandler,
  updateCurrentUserBillingHandler,
  updateCurrentUserPaymentMethodHandler,
  updateCurrentUserNotificationPreferencesHandler,
} from "./users.controller.js";

const usersRouter = Router();

usersRouter.get("/me", authMiddleware, getCurrentUserHandler);
usersRouter.patch("/me", authMiddleware, updateCurrentUserHandler);
usersRouter.delete("/me", authMiddleware, deleteCurrentUserHandler);
usersRouter.get("/me/billing", authMiddleware, getCurrentUserBillingHandler);
usersRouter.patch("/me/billing", authMiddleware, updateCurrentUserBillingHandler);
usersRouter.get("/me/payment-method", authMiddleware, getCurrentUserPaymentMethodHandler);
usersRouter.patch(
  "/me/payment-method",
  authMiddleware,
  updateCurrentUserPaymentMethodHandler,
);
usersRouter.delete(
  "/me/payment-method",
  authMiddleware,
  deleteCurrentUserPaymentMethodHandler,
);
usersRouter.patch("/me/password", authMiddleware, changeCurrentUserPasswordHandler);
usersRouter.get(
  "/me/notifications",
  authMiddleware,
  getCurrentUserNotificationPreferencesHandler,
);
usersRouter.patch(
  "/me/notifications",
  authMiddleware,
  updateCurrentUserNotificationPreferencesHandler,
);

export default usersRouter;
