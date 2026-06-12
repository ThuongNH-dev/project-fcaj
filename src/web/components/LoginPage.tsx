import { useEffect, useState } from "react";
import { Mail, Lock, Eye, EyeOff, Leaf, ArrowRight } from "lucide-react";
import { useLanguage } from "../context/LanguageContext";
import {
  loginUser,
  registerUser,
  setStoredToken,
  setStoredUser,
} from "../api/auth";

interface LoginPageProps {
  onNavigate: (page: string) => void;
  initialMode?: "login" | "register";
}

export function LoginPage({ onNavigate, initialMode = "login" }: LoginPageProps) {
  const [isRegister, setIsRegister] = useState(initialMode === "register");
  const [showPass, setShowPass] = useState(false);
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const { t } = useLanguage();

  useEffect(() => {
    setIsRegister(initialMode === "register");
    setErrorMessage("");
    setSuccessMessage("");
  }, [initialMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!isRegister) {
      if (!form.email.trim()) {
        setErrorMessage("Email is required.");
        return;
      }

      if (!form.password) {
        setErrorMessage("Password is required.");
        return;
      }

      try {
        setIsSubmitting(true);

        const response = await loginUser({
          email: form.email.trim(),
          password: form.password,
        });

        if (response.user) {
          setStoredUser(response.user);
        }

        if (response.token) {
          setStoredToken(response.token);
        }

        setSuccessMessage(response.message);
        onNavigate("dashboard");
      } catch (error) {
        setErrorMessage(
          error instanceof Error ? error.message : "Unable to sign in.",
        );
      } finally {
        setIsSubmitting(false);
      }

      return;
    }

    if (!form.firstName.trim() || !form.lastName.trim()) {
      setErrorMessage("First name and last name are required.");
      return;
    }

    if (!form.email.trim()) {
      setErrorMessage("Email is required.");
      return;
    }

    if (form.password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    if (form.password !== form.confirm) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await registerUser({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        password: form.password,
        defaultCurrency: "USD",
        role: "user",
      });

      setSuccessMessage(response.message);
      setForm({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirm: "",
      });
      setIsRegister(false);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Unable to create account.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F6FBF8] flex">
      {/* Left panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-[#16A34A] p-12 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-20 -right-20 w-80 h-80 bg-white/10 rounded-full" />
          <div className="absolute bottom-20 -left-20 w-64 h-64 bg-white/5 rounded-full" />
        </div>
        <div className="relative flex items-center gap-2.5">
          <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center">
            <Leaf className="w-4 h-4 text-[#16A34A]" strokeWidth={2.5} />
          </div>
          <span className="text-white" style={{ fontWeight: 700, fontSize: "1.25rem" }}>Splitly</span>
        </div>
        <div className="relative">
          <h2 className="text-white mb-4" style={{ fontSize: "2.25rem", fontWeight: 800, lineHeight: 1.15 }}>{t.fairSplits}</h2>
          <p className="text-[#A7F3D0] mb-10" style={{ lineHeight: 1.7 }}>{t.leftPanelDesc}</p>
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
            <p className="text-[#A7F3D0] text-xs uppercase tracking-wider mb-3" style={{ fontWeight: 600 }}>{t.recentActivity}</p>
            {[
              { text: "Alex paid for dinner", amount: "+$84", time: "2m ago" },
              { text: "Mia owes you", amount: "-$42", time: "1h ago" },
              { text: "Trip settled", amount: "✓ $0", time: "Yesterday" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3 mb-3 last:mb-0">
                <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-xs" style={{ fontWeight: 700 }}>{item.text[0]}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate" style={{ fontWeight: 500 }}>{item.text}</p>
                  <p className="text-[#A7F3D0] text-xs">{item.time}</p>
                </div>
                <span className="text-white text-sm" style={{ fontWeight: 700 }}>{item.amount}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="relative text-[#A7F3D0] text-sm">© 2026 Splitly Inc.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-[#7EDDBA] rounded-xl flex items-center justify-center">
              <Leaf className="w-4 h-4 text-[#065f46]" strokeWidth={2.5} />
            </div>
            <span className="text-[#111827]" style={{ fontWeight: 700, fontSize: "1.125rem" }}>Splitly</span>
          </div>

          <div className="mb-8">
            <h1 className="text-[#111827] mb-2" style={{ fontSize: "1.75rem", fontWeight: 800 }}>
              {isRegister ? t.createAccount : t.welcomeBack}
            </h1>
            <p className="text-[#6B7280]">{isRegister ? t.startSplitting : t.signInToContinue}</p>
          </div>

          <button className="w-full flex items-center justify-center gap-3 border border-[#E5E7EB] bg-white rounded-2xl py-3.5 mb-4 hover:bg-[#F9FAFB] transition-colors">
            <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/><path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/><path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/><path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/></svg>
            <span className="text-[#374151] text-sm" style={{ fontWeight: 500 }}>{t.continueWithGoogle}</span>
          </button>

          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-[#E5E7EB]" />
            <span className="text-xs text-[#9CA3AF]" style={{ fontWeight: 500 }}>{t.orWithEmail}</span>
            <div className="flex-1 h-px bg-[#E5E7EB]" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <>
                <div>
                  <label className="block text-sm text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>First name</label>
                  <input type="text" placeholder="Jamie" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                    className="w-full bg-white border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#7EDDBA] focus:border-transparent" />
                </div>
                <div>
                  <label className="block text-sm text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>Last name</label>
                  <input type="text" placeholder="Davis" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                    className="w-full bg-white border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#7EDDBA] focus:border-transparent" />
                </div>
              </>
            )}
            {errorMessage && (
              <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C]">
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div className="rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3 text-sm text-[#166534]">
                {successMessage}
              </div>
            )}
            <div>
              <label className="block text-sm text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>{t.emailAddress}</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                <input type="email" placeholder={t.emailPlaceholder} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full bg-white border border-[#E5E7EB] rounded-xl pl-10 pr-4 py-3 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#7EDDBA] focus:border-transparent" />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm text-[#374151]" style={{ fontWeight: 500 }}>{t.password}</label>
                {!isRegister && <a href="#" className="text-xs text-[#16A34A] hover:underline" style={{ fontWeight: 500 }}>{t.forgotPassword}</a>}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                <input type={showPass ? "text" : "password"} placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full bg-white border border-[#E5E7EB] rounded-xl pl-10 pr-10 py-3 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#7EDDBA] focus:border-transparent" />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF] hover:text-[#374151]">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {isRegister && (
              <div>
                <label className="block text-sm text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>{t.confirmPassword}</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9CA3AF]" />
                  <input type="password" placeholder="••••••••" value={form.confirm} onChange={(e) => setForm({ ...form, confirm: e.target.value })}
                    className="w-full bg-white border border-[#E5E7EB] rounded-xl pl-10 pr-4 py-3 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#7EDDBA] focus:border-transparent" />
                </div>
              </div>
            )}
            <button type="submit" disabled={isSubmitting} className="w-full bg-[#16A34A] text-white py-3.5 rounded-2xl hover:bg-[#15803d] transition-all flex items-center justify-center gap-2 shadow-sm mt-2 disabled:cursor-not-allowed disabled:opacity-70" style={{ fontWeight: 600 }}>
              {isSubmitting ? "Please wait..." : isRegister ? t.createAccountBtn : t.signIn}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="text-center text-sm text-[#6B7280] mt-6">
            {isRegister ? `${t.alreadyHaveAccount} ` : `${t.dontHaveAccount} `}
            <button onClick={() => setIsRegister(!isRegister)} className="text-[#16A34A] hover:underline" style={{ fontWeight: 600 }}>
              {isRegister ? t.signIn : t.signupFree}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
