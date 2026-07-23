import { Db, MongoClient, type ClientSession } from "mongodb";
import { env } from "../config/env.js";

let client: MongoClient | undefined;
let db: Db | undefined;
let lastConnectionError: Error | null = null;

export async function connectToMongo(): Promise<Db> {
  if (db) {
    return db;
  }

  try {
    client ??= new MongoClient(env.mongoUri);
    await client.connect();
    db = client.db(env.mongoDb);
    lastConnectionError = null;

    return db;
  } catch (error) {
    lastConnectionError =
      error instanceof Error ? error : new Error("Unknown MongoDB error");
    db = undefined;

    if (client) {
      await client.close().catch(() => undefined);
      client = undefined;
    }

    throw lastConnectionError;
  }
}

export function getDb(): Db {
  if (!db) {
    throw new Error("MongoDB has not been connected yet.");
  }

  return db;
}

export function getMongoStatus() {
  return {
    connected: Boolean(db),
    error: lastConnectionError?.message ?? null,
  };
}

export async function closeMongoConnection(): Promise<void> {
  if (client) {
    await client.close();
    client = undefined;
    db = undefined;
  }
}

export function getMongoClient(): MongoClient {
  if (!client) {
    throw new Error("MongoDB has not been connected yet.");
  }

  return client;
}

export type { ClientSession };

