import { Router } from "express";
import { authMiddleware } from "../../middleware/auth-middleware.js";
import {
  createGroupHandler,
  deleteGroupHandler,
  getGroupByIdHandler,
  getGroupsHandler,
  updateGroupHandler,
} from "./groups.controller.js";

const groupsRouter = Router();

groupsRouter.get("/", authMiddleware, getGroupsHandler);
groupsRouter.get("/:groupId", authMiddleware, getGroupByIdHandler);
groupsRouter.post("/", authMiddleware, createGroupHandler);
groupsRouter.patch("/:groupId", authMiddleware, updateGroupHandler);
groupsRouter.delete("/:groupId", authMiddleware, deleteGroupHandler);

export default groupsRouter;
