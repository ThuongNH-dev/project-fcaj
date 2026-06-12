import { Router } from "express";
import { authMiddleware } from "../../middleware/auth-middleware.js";
import {
  changeCurrentUserPasswordHandler,
  getCurrentUserHandler,
  updateCurrentUserHandler,
} from "./users.controller.js";

const usersRouter = Router();

usersRouter.get("/me", authMiddleware, getCurrentUserHandler);
usersRouter.patch("/me", authMiddleware, updateCurrentUserHandler);
usersRouter.patch("/me/password", authMiddleware, changeCurrentUserPasswordHandler);

export default usersRouter;
