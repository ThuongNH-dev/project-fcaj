import bcrypt from "bcryptjs";
import type { Collection, ObjectId } from "mongodb";
import { ObjectId as MongoObjectId } from "mongodb";
import { connectToMongo } from "../../db/mongo.js";
import type {
  LoginUserInput,
  PublicUser,
  RegisterUserInput,
  SupportedCurrency,
  UpdateCurrentUserInput,
} from "./auth.types.js";

export interface UserDocument {
  _id?: ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  bio: string;
  avatarUrl: string;
  defaultCurrency: SupportedCurrency;
  role: "admin" | "user";
  createdAt: Date;
  updatedAt: Date;
}

const SUPPORTED_CURRENCIES = new Set<SupportedCurrency>(["USD", "VND"]);

export async function getUsersCollection(): Promise<Collection<UserDocument>> {
  const db = await connectToMongo();
  return db.collection<UserDocument>("users");
}

export function toPublicUser(user: UserDocument): PublicUser {
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

function normalizeDefaultCurrency(defaultCurrency?: string): SupportedCurrency {
  const normalizedDefaultCurrency = defaultCurrency?.trim().toUpperCase();

  if (!normalizedDefaultCurrency) {
    return "USD";
  }

  if (!SUPPORTED_CURRENCIES.has(normalizedDefaultCurrency as SupportedCurrency)) {
    throw new Error("Default currency must be either USD or VND.");
  }

  return normalizedDefaultCurrency as SupportedCurrency;
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
  const normalizedDefaultCurrency = normalizeDefaultCurrency(
    input.defaultCurrency,
  );
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

export async function getUserById(userId: string): Promise<PublicUser | null> {
  if (!MongoObjectId.isValid(userId)) {
    return null;
  }

  const users = await getUsersCollection();
  const user = await users.findOne({ _id: new MongoObjectId(userId) });

  return user ? toPublicUser(user) : null;
}

export async function updateCurrentUserProfile(
  userId: string,
  input: UpdateCurrentUserInput,
): Promise<PublicUser | null> {
  if (!MongoObjectId.isValid(userId)) {
    return null;
  }

  const updateFields: Partial<UserDocument> = {};

  if (input.firstName !== undefined) {
    updateFields.firstName = input.firstName.trim();
  }

  if (input.lastName !== undefined) {
    updateFields.lastName = input.lastName.trim();
  }

  if (input.bio !== undefined) {
    updateFields.bio = input.bio.trim();
  }

  if (input.avatarUrl !== undefined) {
    updateFields.avatarUrl = input.avatarUrl.trim();
  }

  if (input.defaultCurrency !== undefined) {
    updateFields.defaultCurrency = normalizeDefaultCurrency(input.defaultCurrency);
  }

  if (Object.keys(updateFields).length === 0) {
    throw new Error("At least one profile field is required.");
  }

  updateFields.updatedAt = new Date();

  const users = await getUsersCollection();
  const userObjectId = new MongoObjectId(userId);

  await users.updateOne(
    { _id: userObjectId },
    {
      $set: updateFields,
    },
  );

  const updatedUser = await users.findOne({ _id: userObjectId });

  return updatedUser ? toPublicUser(updatedUser) : null;
}
