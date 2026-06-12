import { Router } from "express";
import { authMiddleware } from "../../middleware/auth-middleware.js";
import {
  createGroupHandler,
  getGroupByIdHandler,
  getGroupsHandler,
} from "./groups.controller.js";

const groupsRouter = Router();

groupsRouter.get("/", authMiddleware, getGroupsHandler);
groupsRouter.get("/:groupId", authMiddleware, getGroupByIdHandler);
groupsRouter.post("/", authMiddleware, createGroupHandler);

export default groupsRouter;
