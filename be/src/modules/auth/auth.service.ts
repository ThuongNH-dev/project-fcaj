import bcrypt from "bcryptjs";
import { createHash, randomBytes, randomInt } from "crypto";
import type { Collection, ObjectId } from "mongodb";
import { ObjectId as MongoObjectId } from "mongodb";
import { connectToMongo } from "../../db/mongo.js";
import type {
  BillingPlan,
  ChangeCurrentUserPasswordInput,
  CurrentUserBillingSummary,
  ForgotPasswordInput,
  LoginUserInput,
  PublicUser,
  RegisterUserInput,
  ResetPasswordInput,
  SupportedCurrency,
  UpdateCurrentUserBillingAutoRenewInput,
  UpdateCurrentUserBillingInput,
  UpdateCurrentUserInput,
  UserBillingProfile,
  VerifyResetOtpInput,
} from "./auth.types.js";
import type { NotificationPreferences } from "../notifications/notifications.types.js";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "../notifications/notifications.constants.js";

export interface UserDocument {
  _id?: ObjectId;
  firstName: string;
  lastName: string;
  email: string;
  passwordHash: string;
  bio: string;
  avatarUrl: string;
  defaultCurrency: SupportedCurrency;
  notificationPreferences?: NotificationPreferences;
  billingProfile?: {
    plan: BillingPlan;
    status: "active" | "expired";
    autoRenew: boolean;
    expiresAt?: Date | null;
    updatedAt: Date;
  };
  role: "admin" | "user";
  authProvider?: "local" | "google";
  passwordResetTokenHash?: string;
  passwordResetOtpHash?: string;
  passwordResetExpiresAt?: Date;
  passwordResetRequestedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SUPPORTED_CURRENCIES = new Set<SupportedCurrency>(["USD", "VND"]);
const SUPPORTED_BILLING_PLANS = new Set<BillingPlan>(["free", "pro"]);
const SUPPORTED_USER_ROLES = new Set<UserDocument["role"]>(["admin", "user"]);

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



function normalizeBillingPlan(plan?: string): BillingPlan {
  const normalizedPlan = plan?.trim().toLowerCase();

  if (!normalizedPlan) {
    return "free";
  }

  if (!SUPPORTED_BILLING_PLANS.has(normalizedPlan as BillingPlan)) {
    throw new Error("Billing plan must be either free or pro.");
  }

  return normalizedPlan as BillingPlan;
}

function normalizePaymentText(value: string, fieldName: string) {
  const normalizedValue = value.trim();

  if (!normalizedValue) {
    throw new Error(`${fieldName} is required.`);
  }

  return normalizedValue;
}
function normalizeExpiryMonth(expiryMonth: number) {
  if (!Number.isInteger(expiryMonth) || expiryMonth < 1 || expiryMonth > 12) {
    throw new Error("Expiry month must be between 1 and 12.");
  }

  return expiryMonth;
}

function normalizeExpiryYear(expiryYear: number) {
  if (!Number.isInteger(expiryYear) || expiryYear < 2000 || expiryYear > 9999) {
    throw new Error("Expiry year must be a valid 4-digit year.");
  }

  return expiryYear;
}

function validateExpiryDate(expiryMonth: number, expiryYear: number) {
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  if (
    expiryYear < currentYear ||
    (expiryYear === currentYear && expiryMonth < currentMonth)
  ) {
    throw new Error("Payment card expiry date cannot be in the past.");
  }
}

function normalizeBillingEmail(
  billingEmail: string | undefined,
  fallbackEmail: string,
) {
  const normalizedBillingEmail = (billingEmail?.trim() || fallbackEmail).toLowerCase();

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedBillingEmail)) {
    throw new Error("Billing email must be a valid email address.");
  }

  return normalizedBillingEmail;
}

function toPublicBillingProfile(
  billingProfile: UserDocument["billingProfile"] | undefined,
  fallbackUpdatedAt: Date,
): UserBillingProfile {
  const normalizedUpdatedAt = normalizeDocumentDate(
    billingProfile?.updatedAt,
    fallbackUpdatedAt,
  );
  const normalizedExpiresAt = billingProfile?.expiresAt
    ? normalizeDocumentDate(billingProfile.expiresAt, normalizedUpdatedAt)
    : null;
  const isExpired =
    Boolean(normalizedExpiresAt) && normalizedExpiresAt.getTime() <= Date.now();

  return {
    plan: isExpired ? "free" : normalizeBillingPlan(billingProfile?.plan),
    status: isExpired ? "expired" : "active",
    autoRenew: isExpired ? false : billingProfile?.autoRenew ?? false,
    expiresAt: normalizedExpiresAt?.toISOString() ?? null,
    updatedAt: normalizedUpdatedAt.toISOString(),
  };
}

function getBillingUsageSummary(plan: BillingPlan, input: {
  groupCount: number;
  expenseCount: number;
}): CurrentUserBillingSummary["usage"] {
  if (plan === "pro") {
    return {
      groupCount: input.groupCount,
      groupLimit: null,
      expenseCount: input.expenseCount,
      expenseLimit: null,
      receiptScanIncluded: true,
    };
  }

  return {
    groupCount: input.groupCount,
    groupLimit: 3,
    expenseCount: input.expenseCount,
    expenseLimit: 5,
    receiptScanIncluded: false,
  };
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

export function normalizeUserRole(role?: string): UserDocument["role"] {
  const normalizedRole = role?.trim().toLowerCase();

  if (!normalizedRole) {
    throw new Error("User role is required.");
  }

  if (!SUPPORTED_USER_ROLES.has(normalizedRole as UserDocument["role"])) {
    throw new Error("User role must be either admin or user.");
  }

  return normalizedRole as UserDocument["role"];
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
    notificationPreferences: { ...DEFAULT_NOTIFICATION_PREFERENCES },
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
    notificationPreferences: { ...DEFAULT_NOTIFICATION_PREFERENCES },
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

export async function loginOrRegisterWithGoogle(profile: {
  email: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
}): Promise<PublicUser> {
  const users = await getUsersCollection();
  const normalizedEmail = profile.email.trim().toLowerCase();

  if (!normalizedEmail) {
    throw new Error("Google account did not return an email address.");
  }

  const existingUser = await users.findOne({ email: normalizedEmail });

  if (existingUser?._id) {
    const updateFields: Partial<UserDocument> = {};

    if (!existingUser.avatarUrl && profile.avatarUrl) {
      updateFields.avatarUrl = profile.avatarUrl;
    }

    if (!existingUser.authProvider) {
      updateFields.authProvider = "google";
    }

    if (Object.keys(updateFields).length > 0) {
      updateFields.updatedAt = new Date();

      await users.updateOne(
        { _id: existingUser._id },
        { $set: updateFields },
      );
    }

    return toPublicUser({ ...existingUser, ...updateFields });
  }

  const normalizedFirstName = profile.firstName.trim() || "Google";
  const normalizedLastName = profile.lastName.trim() || "User";
  const createdAt = new Date();
  const updatedAt = createdAt;
  // Google-authenticated accounts don't use a local password; store an
  // unguessable random hash so the password field stays non-empty and
  // unusable for a normal email/password login.
  const passwordHash = await bcrypt.hash(randomBytes(32).toString("hex"), 10);

  const newUserDocument: UserDocument = {
    firstName: normalizedFirstName,
    lastName: normalizedLastName,
    email: normalizedEmail,
    passwordHash,
    bio: "",
    avatarUrl: profile.avatarUrl?.trim() ?? "",
    defaultCurrency: "USD",
    notificationPreferences: { ...DEFAULT_NOTIFICATION_PREFERENCES },
    role: "user",
    authProvider: "google",
    createdAt,
    updatedAt,
  };

  const result = await users.insertOne(newUserDocument);

  return toPublicUser({ ...newUserDocument, _id: result.insertedId });
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

export async function countUsersByRole(role: UserDocument["role"]) {
  const users = await getUsersCollection();
  return users.countDocuments({ role });
}

export async function updateUserRoleById(
  userId: string,
  role: string,
): Promise<PublicUser | null> {
  if (!MongoObjectId.isValid(userId)) {
    return null;
  }

  const normalizedRole = normalizeUserRole(role);
  const users = await getUsersCollection();
  const userObjectId = new MongoObjectId(userId);

  await users.updateOne(
    { _id: userObjectId },
    {
      $set: {
        role: normalizedRole,
        updatedAt: new Date(),
      },
    },
  );

  const updatedUser = await users.findOne({ _id: userObjectId });

  return updatedUser ? toPublicUser(updatedUser) : null;
}

export async function deleteUserById(userId: string): Promise<boolean | null> {
  if (!MongoObjectId.isValid(userId)) {
    return null;
  }

  const users = await getUsersCollection();
  const result = await users.deleteOne({
    _id: new MongoObjectId(userId),
  });

  return result.deletedCount > 0;
}

export async function getCurrentUserBillingSummary(
  userId: string,
): Promise<CurrentUserBillingSummary | null> {
  if (!MongoObjectId.isValid(userId)) {
    return null;
  }

  const users = await getUsersCollection();
  const user = await users.findOne({ _id: new MongoObjectId(userId) });

  if (!user?._id) {
    return null;
  }

  const db = await connectToMongo();
  const groups = db.collection<{
    members: Array<{ userId: string }>;
  }>("groups");
  const expenses = db.collection<{
    createdBy: string;
    createdAt: Date;
  }>("expenses");
  const currentMonthStart = new Date();

  currentMonthStart.setDate(1);
  currentMonthStart.setHours(0, 0, 0, 0);

  const [groupCount, expenseCount] = await Promise.all([
    groups.countDocuments({ "members.userId": userId }),
    expenses.countDocuments({
      createdBy: userId,
      createdAt: {
        $gte: currentMonthStart,
      },
    }),
  ]);

  const fallbackUpdatedAt = normalizeDocumentDate(user.updatedAt, user._id.getTimestamp());
  const profile = toPublicBillingProfile(user.billingProfile, fallbackUpdatedAt);

  if (user.billingProfile?.plan === "pro" && profile.status === "expired") {
    await users.updateOne(
      { _id: user._id },
      {
        $set: {
          billingProfile: {
            plan: "free",
            status: "expired",
            autoRenew: false,
            expiresAt: user.billingProfile.expiresAt ?? null,
            updatedAt: new Date(),
          },
          updatedAt: new Date(),
        },
      },
    );
  }

  return {
    profile,
    usage: getBillingUsageSummary(profile.plan, {
      groupCount,
      expenseCount,
    }),
  };
}

export async function updateCurrentUserBillingPlan(
  userId: string,
  input: UpdateCurrentUserBillingInput,
): Promise<CurrentUserBillingSummary | null> {
  if (!MongoObjectId.isValid(userId)) {
    return null;
  }

  const normalizedPlan = normalizeBillingPlan(input.plan);
  const users = await getUsersCollection();
  const userObjectId = new MongoObjectId(userId);
  const existingUser = await users.findOne({ _id: userObjectId });

  if (!existingUser) {
    return null;
  }
  const updatedAt = new Date();

  const result = await users.updateOne(
    { _id: userObjectId },
    {
      $set: {
        billingProfile: {
          plan: normalizedPlan,
          status: "active",
          autoRenew: existingUser.billingProfile?.autoRenew ?? false,
          expiresAt: normalizedPlan === "pro" ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null,
          updatedAt,
        },
        updatedAt,
      },
    },
  );

  if (result.matchedCount === 0) {
    return null;
  }

  return getCurrentUserBillingSummary(userId);
}

export async function updateCurrentUserBillingAutoRenew(
  userId: string,
  input: UpdateCurrentUserBillingAutoRenewInput,
): Promise<CurrentUserBillingSummary | null> {
  if (!MongoObjectId.isValid(userId)) {
    return null;
  }

  const users = await getUsersCollection();
  const userObjectId = new MongoObjectId(userId);
  const existingUser = await users.findOne({ _id: userObjectId });

  if (!existingUser) {
    return null;
  }

  const currentPlan = normalizeBillingPlan(existingUser.billingProfile?.plan);
  const autoRenew = Boolean(input.autoRenew);
  const updatedAt = new Date();

  await users.updateOne(
    { _id: userObjectId },
    {
      $set: {
        billingProfile: {
          plan: currentPlan,
          status: "active",
          autoRenew: currentPlan === "pro" ? autoRenew : false,
          expiresAt: existingUser.billingProfile?.expiresAt ?? (currentPlan === "pro" ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) : null),
          updatedAt,
        },
        updatedAt,
      },
    },
  );

  return getCurrentUserBillingSummary(userId);
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