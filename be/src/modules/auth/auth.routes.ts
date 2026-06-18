import { Router } from "express";
import {
  forgotPasswordHandler,
  loginUserHandler,
  registerUserHandler,
  resetPasswordHandler,
} from "./auth.controller.js";

const authRouter = Router();

authRouter.post("/login", loginUserHandler);
authRouter.post("/register", registerUserHandler);
authRouter.post("/forgot-password", forgotPasswordHandler);
authRouter.post("/reset-password", resetPasswordHandler);

export default authRouter;
