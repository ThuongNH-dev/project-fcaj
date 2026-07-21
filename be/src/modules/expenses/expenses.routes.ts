import { Router } from "express";
import { authMiddleware } from "../../middleware/auth-middleware.js";
import {
  createExpenseHandler,
  deleteExpenseHandler,
  getExpenseByIdHandler,
  getExpensesHandler,
  settleExpenseHandler,
  updateExpenseHandler,
} from "./expenses.controller.js";

const expensesRouter = Router();

expensesRouter.get("/", authMiddleware, getExpensesHandler);
expensesRouter.get("/:expenseId", authMiddleware, getExpenseByIdHandler);
expensesRouter.post("/", authMiddleware, createExpenseHandler);
expensesRouter.patch("/:expenseId", authMiddleware, updateExpenseHandler);
expensesRouter.delete("/:expenseId", authMiddleware, deleteExpenseHandler);
expensesRouter.patch("/:expenseId/settlement", authMiddleware, settleExpenseHandler);

export default expensesRouter;
