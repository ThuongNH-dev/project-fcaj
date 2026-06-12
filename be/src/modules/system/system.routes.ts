import { Router } from "express";
import {
  getApiTestHandler,
  getHealthHandler,
} from "./system.controller.js";

const systemRouter = Router();

systemRouter.get("/health", getHealthHandler);
systemRouter.get("/api/test", getApiTestHandler);

export default systemRouter;
