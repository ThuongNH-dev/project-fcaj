import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router";
import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Leaf,
  Lock,
  Mail,
} from "lucide-react";
import { resetPassword, verifyResetOtp } from "../api/auth";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "./ui/input-otp";

type ResetStep = "otp" | "password";

interface ResetPasswordLocationState {
  message?: string;
}

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const locationState = location.state as ResetPasswordLocationState | null;
  const token = searchParams.get("token")?.trim() ?? "";
  const isUsingResetLink = Boolean(token);
  const [step, setStep] = useState<ResetStep>(
    isUsingResetLink ? "password" : "otp",
  );
  const [email, setEmail] = useState(searchParams.get("email") ?? "");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState(
    locationState?.message ?? "",
  );
  const navigate = useNavigate();

  useEffect(() => {
    setEmail(searchParams.get("email") ?? "");
    setStep(isUsingResetLink ? "password" : "otp");
  }, [isUsingResetLink, searchParams]);

  const handleVerifyOtp = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!email.trim()) {
      setErrorMessage("Email is required when using an OTP code.");
      return;
    }

    if (!/^\d{6}$/.test(otp)) {
      setErrorMessage("Enter the 6-digit OTP code sent to your email.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await verifyResetOtp({
        email: email.trim(),
        otp,
      });

      setSuccessMessage(response.message);
      setStep("password");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to verify OTP.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!isUsingResetLink && !email.trim()) {
      setErrorMessage("Email is required when using an OTP code.");
      return;
    }

    if (!isUsingResetLink && !/^\d{6}$/.test(otp)) {
      setErrorMessage("Enter the 6-digit OTP code sent to your email.");
      setStep("otp");
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await resetPassword({
        token: isUsingResetLink ? token : undefined,
        email: isUsingResetLink ? undefined : email.trim(),
        otp: isUsingResetLink ? undefined : otp,
        newPassword,
      });

      setSuccessMessage(response.message);
      setNewPassword("");
      setConfirmPassword("");
      setOtp("");
      window.setTimeout(() => {
        navigate("/login", { replace: true });
      }, 900);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to reset password.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const isOtpStep = !isUsingResetLink && step === "otp";

  return (
    <div className="min-h-screen bg-[#F6FBF8] flex items-center justify-center px-6 py-10">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate("/login")}
          className="mb-6 inline-flex items-center gap-2 text-sm text-[#6B7280] hover:text-[#111827] transition-colors"
          style={{ fontWeight: 600 }}
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </button>

        <div className="mb-8 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#7EDDBA]">
            <Leaf className="h-4 w-4 text-[#065f46]" strokeWidth={2.5} />
          </div>
          <span
            className="text-[#111827]"
            style={{ fontWeight: 700, fontSize: "1.25rem" }}
          >
            Splitly
          </span>
        </div>

        <div className="rounded-3xl border border-[#E5E7EB] bg-white p-6 shadow-sm">
          <div className="mb-6">
            <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F0FAF5]">
              {successMessage && !isOtpStep ? (
                <CheckCircle2 className="h-6 w-6 text-[#16A34A]" />
              ) : (
                <KeyRound className="h-6 w-6 text-[#16A34A]" />
              )}
            </div>
            <h1
              className="mb-2 text-[#111827]"
              style={{ fontSize: "1.75rem", fontWeight: 800 }}
            >
              {isOtpStep ? "Enter your OTP" : "Create a new password"}
            </h1>
            <p className="text-sm text-[#6B7280]">
              {isUsingResetLink
                ? "Your reset link is ready. Choose a new password to continue."
                : isOtpStep
                  ? "We sent a 6-digit code to your email. Verify it before choosing a new password."
                  : "OTP verified. Choose a new password for your account."}
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="mb-4 rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3 text-sm text-[#166534]">
              {successMessage}
            </div>
          )}

          {isOtpStep ? (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label
                  className="mb-1.5 block text-sm text-[#374151]"
                  style={{ fontWeight: 600 }}
                >
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] py-3 pl-10 pr-4 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#7EDDBA]"
                  />
                </div>
              </div>

              <div>
                <label
                  className="mb-2 block text-sm text-[#374151]"
                  style={{ fontWeight: 600 }}
                >
                  OTP code
                </label>
                <InputOTP
                  maxLength={6}
                  value={otp}
                  onChange={setOtp}
                  containerClassName="justify-between"
                >
                  <InputOTPGroup className="gap-2">
                    {Array.from({ length: 6 }).map((_, index) => (
                      <InputOTPSlot
                        key={index}
                        index={index}
                        className="h-11 w-11 rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] text-base text-[#111827] first:rounded-xl first:border-l last:rounded-xl data-[active=true]:border-[#16A34A] data-[active=true]:ring-[#7EDDBA]/40"
                      />
                    ))}
                  </InputOTPGroup>
                </InputOTP>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#16A34A] py-3.5 text-white shadow-sm transition-colors hover:bg-[#15803d] disabled:cursor-not-allowed disabled:opacity-70"
                style={{ fontWeight: 700 }}
              >
                <KeyRound className="h-4 w-4" />
                {isSubmitting ? "Verifying..." : "Verify OTP"}
              </button>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label
                  className="mb-1.5 block text-sm text-[#374151]"
                  style={{ fontWeight: 600 }}
                >
                  New password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                  <input
                    type="password"
                    placeholder="At least 6 characters"
                    value={newPassword}
                    onChange={(event) => setNewPassword(event.target.value)}
                    className="w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] py-3 pl-10 pr-4 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#7EDDBA]"
                  />
                </div>
              </div>

              <div>
                <label
                  className="mb-1.5 block text-sm text-[#374151]"
                  style={{ fontWeight: 600 }}
                >
                  Confirm password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9CA3AF]" />
                  <input
                    type="password"
                    placeholder="Repeat new password"
                    value={confirmPassword}
                    onChange={(event) => setConfirmPassword(event.target.value)}
                    className="w-full rounded-xl border border-[#E5E7EB] bg-[#F9FAFB] py-3 pl-10 pr-4 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#7EDDBA]"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#16A34A] py-3.5 text-white shadow-sm transition-colors hover:bg-[#15803d] disabled:cursor-not-allowed disabled:opacity-70"
                style={{ fontWeight: 700 }}
              >
                <KeyRound className="h-4 w-4" />
                {isSubmitting ? "Resetting..." : "Reset password"}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
