export {
  forgotPassword,
  loginUser,
  loginWithGoogle,
  registerUser,
  resetPassword,
  verifyResetOtp,
} from "./api/auth.api";
export {
  isGoogleSignInConfigured,
  requestGoogleAccessToken,
} from "./lib/google-auth";
export {
  clearStoredUser,
  getStoredAuthSession,
  getStoredToken,
  getStoredUser,
  hasStoredAuthSession,
  getUserInitials,
  setStoredAuthSession,
  setStoredToken,
  setStoredUser,
  subscribeToStoredUser,
} from "./storage/auth.storage";
export { useStoredUser } from "./hooks/useStoredUser";
export type {
  AuthResponse,
  AuthUser,
  ForgotPasswordPayload,
  ForgotPasswordResponse,
  GoogleAuthPayload,
  LoginPayload,
  RegisterPayload,
  ResetPasswordPayload,
  ResetPasswordResponse,
  UserRole,
  VerifyResetOtpPayload,
  VerifyResetOtpResponse,
} from "./models/auth.types";
