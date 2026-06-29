import { Router } from "express";
import { authMiddleware } from "../../middleware/auth-middleware.js";
import {
  changeCurrentUserPasswordHandler,
  getCurrentUserHandler,
  getCurrentUserNotificationPreferencesHandler,
  updateCurrentUserHandler,
  updateCurrentUserNotificationPreferencesHandler,
} from "./users.controller.js";

const usersRouter = Router();

usersRouter.get("/me", authMiddleware, getCurrentUserHandler);
usersRouter.patch("/me", authMiddleware, updateCurrentUserHandler);
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
