import bcrypt from "bcryptjs";
import type { Collection } from "mongodb";
import { connectToMongo } from "../../db/mongo.js";
import type { PublicUser, RegisterUserInput } from "./auth.types.js";

interface UserDocument {
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  bio: string;
  avatarUrl: string;
  defaultCurrency: string;
  role: "admin" | "user";
  createdAt: Date;
  updatedAt: Date;
}

async function getUsersCollection(): Promise<Collection<UserDocument>> {
  const db = await connectToMongo();
  return db.collection<UserDocument>("users");
}

export async function registerUser(
  input: RegisterUserInput,
): Promise<PublicUser> {
  const users = await getUsersCollection();
  const normalizedFirstName = input.firstName.trim();
  const normalizedLastName = input.lastName.trim();
  const normalizedEmail = input.email.trim().toLowerCase();
  const normalizedBio = input.bio?.trim() ?? "";
  const normalizedAvatarUrl = input.avatarUrl?.trim() ?? "";
  const normalizedDefaultCurrency =
    input.defaultCurrency?.trim().toUpperCase() || "USD";
  const normalizedRole = input.role === "admin" ? "admin" : "user";

  const existingUser = await users.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw new Error("An account with this email already exists.");
  }

  const createdAt = new Date();
  const updatedAt = createdAt;
  const passwordHash = await bcrypt.hash(input.password, 10);

  const result = await users.insertOne({
    firstName: normalizedFirstName,
    lastName: normalizedLastName,
    email: normalizedEmail,
    passwordHash,
    bio: normalizedBio,
    avatarUrl: normalizedAvatarUrl,
    defaultCurrency: normalizedDefaultCurrency,
    role: normalizedRole,
    createdAt,
    updatedAt,
  });

  return {
    id: result.insertedId.toString(),
    firstName: normalizedFirstName,
    lastName: normalizedLastName,
    email: normalizedEmail,
    bio: normalizedBio,
    avatarUrl: normalizedAvatarUrl,
    defaultCurrency: normalizedDefaultCurrency,
    role: normalizedRole,
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
  };
}
