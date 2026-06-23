import { Router } from "express";
import { authMiddleware } from "../../middleware/auth-middleware.js";
import {
  createExpenseHandler,
  getExpenseByIdHandler,
  getExpensesHandler,
  settleExpenseHandler,
} from "./expenses.controller.js";

const expensesRouter = Router();

expensesRouter.get("/", authMiddleware, getExpensesHandler);
expensesRouter.get("/:expenseId", authMiddleware, getExpenseByIdHandler);
expensesRouter.post("/", authMiddleware, createExpenseHandler);
expensesRouter.patch("/:expenseId/settlement", authMiddleware, settleExpenseHandler);

export default expensesRouter;
