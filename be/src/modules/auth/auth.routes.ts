import { Router } from "express";
import { registerUserHandler } from "./auth.controller.js";

const authRouter = Router();

authRouter.post("/register", registerUserHandler);

export default authRouter;
