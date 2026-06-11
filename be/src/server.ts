import { env } from "./config/env.js";
import { closeMongoConnection, connectToMongo } from "./db/mongo.js";
import { createApp } from "./app.js";

const app = createApp();

async function startServer() {
  app.listen(env.port, () => {
    console.log(`Backend server listening on http://localhost:${env.port}`);
  });

  try {
    await connectToMongo();
    console.log("MongoDB connected.");
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown MongoDB error";
    console.error("MongoDB connection failed. Fix be/.env and retry:", message);
  }
}

async function shutdown() {
  await closeMongoConnection();
  process.exit(0);
}

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

startServer();
