import { Router } from "express";
import { loginUserHandler, registerUserHandler } from "./auth.controller.js";

const authRouter = Router();

authRouter.post("/login", loginUserHandler);
authRouter.post("/register", registerUserHandler);

export default authRouter;
