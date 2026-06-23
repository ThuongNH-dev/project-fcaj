import bcrypt from "bcryptjs";
import { createHash, randomBytes, randomInt } from "crypto";
import type { Collection, ObjectId } from "mongodb";
import { ObjectId as MongoObjectId } from "mongodb";
import { connectToMongo } from "../../db/mongo.js";
import type {
  ChangeCurrentUserPasswordInput,
  ForgotPasswordInput,
  LoginUserInput,
  PublicUser,
  RegisterUserInput,
  ResetPasswordInput,
  SupportedCurrency,
  UpdateCurrentUserInput,
  VerifyResetOtpInput,
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
  passwordResetTokenHash?: string;
  passwordResetOtpHash?: string;
  passwordResetExpiresAt?: Date;
  passwordResetRequestedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SUPPORTED_CURRENCIES = new Set<SupportedCurrency>(["USD", "VND"]);
const PASSWORD_RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

export async function getUsersCollection(): Promise<Collection<UserDocument>> {
  const db = await connectToMongo();
  return db.collection<UserDocument>("users");
}

function normalizeDocumentDate(
  value: Date | string | undefined,
  fallbackDate: Date,
) {
  const normalizedDate = value instanceof Date ? value : value ? new Date(value) : fallbackDate;

  return Number.isNaN(normalizedDate.getTime()) ? fallbackDate : normalizedDate;
}

export function toPublicUser(user: UserDocument): PublicUser {
  if (!user._id) {
    throw new Error("User document is missing an id.");
  }

  const createdAt = normalizeDocumentDate(user.createdAt, user._id.getTimestamp());
  const updatedAt = normalizeDocumentDate(user.updatedAt, createdAt);

  return {
    id: user._id.toString(),
    firstName: user.firstName ?? "",
    lastName: user.lastName ?? "",
    email: user.email,
    bio: user.bio ?? "",
    avatarUrl: user.avatarUrl ?? "",
    defaultCurrency: user.defaultCurrency ?? "USD",
    role: user.role ?? "user",
    createdAt: createdAt.toISOString(),
    updatedAt: updatedAt.toISOString(),
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

function hashPasswordResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function generatePasswordResetOtp() {
  return randomInt(0, 1_000_000).toString().padStart(6, "0");
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
  const normalizedRole: UserDocument["role"] = "user";

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

export async function requestPasswordReset(input: ForgotPasswordInput): Promise<{
  resetToken: string | null;
  otpCode: string | null;
  expiresAt: Date | null;
}> {
  const users = await getUsersCollection();
  const normalizedEmail = input.email.trim().toLowerCase();

  if (!normalizedEmail) {
    return {
      resetToken: null,
      otpCode: null,
      expiresAt: null,
    };
  }

  const user = await users.findOne({ email: normalizedEmail });

  if (!user?._id) {
    return {
      resetToken: null,
      otpCode: null,
      expiresAt: null,
    };
  }

  const resetToken = randomBytes(32).toString("hex");
  const otpCode = generatePasswordResetOtp();
  const now = new Date();
  const expiresAt = new Date(now.getTime() + PASSWORD_RESET_TOKEN_TTL_MS);

  await users.updateOne(
    { _id: user._id },
    {
      $set: {
        passwordResetTokenHash: hashPasswordResetToken(resetToken),
        passwordResetOtpHash: hashPasswordResetToken(otpCode),
        passwordResetExpiresAt: expiresAt,
        passwordResetRequestedAt: now,
        updatedAt: now,
      },
    },
  );

  return {
    resetToken,
    otpCode,
    expiresAt,
  };
}

export async function resetPasswordWithToken(
  input: ResetPasswordInput,
): Promise<boolean> {
  const resetToken = input.token?.trim() ?? "";
  const otpCode = input.otp?.trim() ?? "";
  const normalizedEmail = input.email?.trim().toLowerCase() ?? "";

  if (!resetToken && (!normalizedEmail || !otpCode)) {
    throw new Error("Password reset token or email and OTP are required.");
  }

  if (input.newPassword.length < 6) {
    throw new Error("Password must be at least 6 characters.");
  }

  const users = await getUsersCollection();
  const now = new Date();
  const resetCredentialFilter = resetToken
    ? {
        passwordResetTokenHash: hashPasswordResetToken(resetToken),
      }
    : {
        email: normalizedEmail,
        passwordResetOtpHash: hashPasswordResetToken(otpCode),
      };
  const user = await users.findOne({
    ...resetCredentialFilter,
    passwordResetExpiresAt: {
      $gt: now,
    },
  });

  if (!user?._id) {
    throw new Error("Password reset token or OTP is invalid or has expired.");
  }

  const passwordHash = await bcrypt.hash(input.newPassword, 10);

  await users.updateOne(
    { _id: user._id },
    {
      $set: {
        passwordHash,
        updatedAt: now,
      },
      $unset: {
        passwordResetTokenHash: "",
        passwordResetOtpHash: "",
        passwordResetExpiresAt: "",
        passwordResetRequestedAt: "",
      },
    },
  );

  return true;
}

export async function verifyPasswordResetOtp(
  input: VerifyResetOtpInput,
): Promise<boolean> {
  const normalizedEmail = input.email.trim().toLowerCase();
  const otpCode = input.otp.trim();

  if (!normalizedEmail || !otpCode) {
    throw new Error("Email and OTP are required.");
  }

  const users = await getUsersCollection();
  const user = await users.findOne({
    email: normalizedEmail,
    passwordResetOtpHash: hashPasswordResetToken(otpCode),
    passwordResetExpiresAt: {
      $gt: new Date(),
    },
  });

  if (!user?._id) {
    throw new Error("OTP is invalid or has expired.");
  }

  return true;
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

export async function changeCurrentUserPassword(
  userId: string,
  input: ChangeCurrentUserPasswordInput,
): Promise<boolean | null> {
  if (!MongoObjectId.isValid(userId)) {
    return null;
  }

  const users = await getUsersCollection();
  const userObjectId = new MongoObjectId(userId);
  const user = await users.findOne({ _id: userObjectId });

  if (!user) {
    return null;
  }

  const isPasswordValid = await bcrypt.compare(
    input.currentPassword,
    user.passwordHash,
  );

  if (!isPasswordValid) {
    throw new Error("Current password is incorrect.");
  }

  const passwordHash = await bcrypt.hash(input.newPassword, 10);

  await users.updateOne(
    { _id: userObjectId },
    {
      $set: {
        passwordHash,
        updatedAt: new Date(),
      },
    },
  );

  return true;
}
