import { Router } from "express";
import { authMiddleware } from "../../middleware/auth-middleware.js";
import {
  createExpenseHandler,
  getExpensesHandler,
} from "./expenses.controller.js";

const expensesRouter = Router();

expensesRouter.get("/", authMiddleware, getExpensesHandler);
expensesRouter.post("/", authMiddleware, createExpenseHandler);

export default expensesRouter;
