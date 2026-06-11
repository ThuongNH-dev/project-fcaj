import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./config/swagger.js";
import { errorHandler } from "./middleware/error-handler.js";
import apiRouter from "./routes/index.js";

export function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json());

  app.get("/docs.json", (_req, res) => {
    res.json(swaggerSpec);
  });

  app.use(apiRouter);

  app.use(
    "/",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, {
      explorer: true,
    }),
  );

  app.use(errorHandler);

  return app;
}
