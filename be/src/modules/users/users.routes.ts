import { Router } from "express";
import { authMiddleware } from "../../middleware/auth-middleware.js";
import {
  getCurrentUserHandler,
  updateCurrentUserHandler,
} from "./users.controller.js";

const usersRouter = Router();

usersRouter.get("/me", authMiddleware, getCurrentUserHandler);
usersRouter.patch("/me", authMiddleware, updateCurrentUserHandler);

export default usersRouter;
