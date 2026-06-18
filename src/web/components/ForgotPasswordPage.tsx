import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { ArrowLeft, KeyRound, Leaf, Mail, Send } from "lucide-react";
import { forgotPassword, type ForgotPasswordResponse } from "../api/auth";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [response, setResponse] = useState<ForgotPasswordResponse | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setErrorMessage("");
    setResponse(null);

    if (!email.trim()) {
      setErrorMessage("Email is required.");
      return;
    }

    try {
      setIsSubmitting(true);
      const forgotPasswordResponse = await forgotPassword({
        email: email.trim(),
      });

      setResponse(forgotPasswordResponse);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to request password reset.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleContinueWithOtp = () => {
    const query = new URLSearchParams({
      email: email.trim(),
    });

    navigate(`/reset-password?${query.toString()}`);
  };

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
              <KeyRound className="h-6 w-6 text-[#16A34A]" />
            </div>
            <h1
              className="mb-2 text-[#111827]"
              style={{ fontSize: "1.75rem", fontWeight: 800 }}
            >
              Reset your password
            </h1>
            <p className="text-sm text-[#6B7280]">
              Enter your account email. We will send an OTP code and a reset
              link if the account exists.
            </p>
          </div>

          {errorMessage && (
            <div className="mb-4 rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
              {errorMessage}
            </div>
          )}

          {response && (
            <div className="mb-4 rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3 text-sm text-[#166534]">
              <p style={{ fontWeight: 600 }}>{response.message}</p>
              {response.otpCode && (
                <div className="mt-3 rounded-lg bg-white px-3 py-2">
                  <p className="text-xs text-[#6B7280]">Dev OTP</p>
                  <p
                    className="tracking-[0.35em] text-[#111827]"
                    style={{ fontWeight: 800, fontSize: "1.25rem" }}
                  >
                    {response.otpCode}
                  </p>
                </div>
              )}
              {response.resetUrl && (
                <a
                  href={response.resetUrl}
                  className="mt-3 inline-flex text-sm text-[#16A34A] hover:underline"
                  style={{ fontWeight: 700 }}
                >
                  Open dev reset link
                </a>
              )}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#16A34A] py-3.5 text-white shadow-sm transition-colors hover:bg-[#15803d] disabled:cursor-not-allowed disabled:opacity-70"
              style={{ fontWeight: 700 }}
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? "Sending..." : "Send reset code"}
            </button>
          </form>

          {response && (
            <button
              type="button"
              onClick={handleContinueWithOtp}
              className="mt-4 w-full rounded-xl border border-[#D1FAE5] bg-[#F0FAF5] py-3 text-sm text-[#166534] transition-colors hover:bg-[#DCFCE7]"
              style={{ fontWeight: 700 }}
            >
              Continue with OTP
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
