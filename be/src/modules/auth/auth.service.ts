import bcrypt from "bcryptjs";
import type { Collection, ObjectId } from "mongodb";
import { connectToMongo } from "../../db/mongo.js";
import type {
  LoginUserInput,
  PublicUser,
  RegisterUserInput,
} from "./auth.types.js";

interface UserDocument {
  _id?: ObjectId;
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

function toPublicUser(user: UserDocument): PublicUser {
  if (!user._id) {
    throw new Error("User document is missing an id.");
  }

  return {
    id: user._id.toString(),
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    bio: user.bio,
    avatarUrl: user.avatarUrl,
    defaultCurrency: user.defaultCurrency,
    role: user.role,
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
  };
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

  return toPublicUser({
    _id: result.insertedId,
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
}

export async function loginUser(input: LoginUserInput): Promise<PublicUser> {
  const users = await getUsersCollection();
  const normalizedEmail = input.email.trim().toLowerCase();
  const user = await users.findOne({ email: normalizedEmail });

  if (!user) {
    throw new Error("Invalid email or password.");
  }

  const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);

  if (!isPasswordValid) {
    throw new Error("Invalid email or password.");
  }

  return toPublicUser(user);
}
