import { Router } from "express";
import {
  forgotPasswordHandler,
  loginUserHandler,
  registerUserHandler,
  resetPasswordHandler,
  verifyResetOtpHandler,
} from "./auth.controller.js";

const authRouter = Router();

authRouter.post("/login", loginUserHandler);
authRouter.post("/register", registerUserHandler);
authRouter.post("/forgot-password", forgotPasswordHandler);
authRouter.post("/verify-reset-otp", verifyResetOtpHandler);
authRouter.post("/reset-password", resetPasswordHandler);

export default authRouter;
