import type { Request, Response } from "express";
import { connectToMongo, getDb, getMongoStatus } from "../../db/mongo.js";

export async function getHealthHandler(_req: Request, res: Response) {
  const status = getMongoStatus();

  if (!status.connected) {
    return res.status(503).json({
      ok: false,
      message: "Backend is running but MongoDB is not connected.",
      mongo: status,
    });
  }

  const db = getDb();
  await db.command({ ping: 1 });

  return res.json({
    ok: true,
    message: "Backend is running and MongoDB is connected.",
    mongo: status,
  });
}

export async function getApiTestHandler(_req: Request, res: Response) {
  try {
    const db = await connectToMongo();
    const collection = db.collection("app_meta");

    const document = await collection.findOneAndUpdate(
      { key: "backend_status" },
      {
        $set: {
          key: "backend_status",
          updatedAt: new Date(),
          value: "MongoDB connection is working",
        },
      },
      {
        upsert: true,
        returnDocument: "after",
      },
    );

    return res.json({
      ok: true,
      data: document,
    });
  } catch (error) {
    return res.status(503).json({
      ok: false,
      message: "MongoDB connection failed.",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
}
