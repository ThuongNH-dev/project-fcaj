import { Router } from "express";
import { authMiddleware } from "../../middleware/auth-middleware.js";
import {
  addGroupMemberHandler,
  createGroupHandler,
  deleteGroupHandler,
  getGroupByIdHandler,
  getGroupsHandler,
  removeGroupMemberHandler,
  updateGroupHandler,
} from "./groups.controller.js";

const groupsRouter = Router();

groupsRouter.get("/", authMiddleware, getGroupsHandler);
groupsRouter.get("/:groupId", authMiddleware, getGroupByIdHandler);
groupsRouter.post("/", authMiddleware, createGroupHandler);
groupsRouter.patch("/:groupId", authMiddleware, updateGroupHandler);
groupsRouter.delete("/:groupId", authMiddleware, deleteGroupHandler);
groupsRouter.post("/:groupId/members", authMiddleware, addGroupMemberHandler);
groupsRouter.delete(
  "/:groupId/members/:memberId",
  authMiddleware,
  removeGroupMemberHandler,
);

export default groupsRouter;
