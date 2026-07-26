import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { useTheme } from "next-themes";
import { useNavigate } from "react-router";
import {
  User,
  Bell,
  Shield,
  CreditCard,
  Palette,
  Check,
  Camera,
  Trash2,
  LogOut,
} from "lucide-react";
import { useLanguage } from "../../../shared/providers/LanguageProvider";
import { formatLocalDate } from "../../../shared/lib/formatters";
import {
  type AccentColor,
  useAppearance,
} from "../../../shared/providers/AppearanceProvider";
import { useFeedback } from "../../../shared/providers/FeedbackProvider";
import { createVnpayBillingPayment } from "../../payments/api/payments.api";
import {
  clearStoredUser,
  getUserInitials,
  setStoredUser,
  useStoredUser,
} from "../../auth";
import {
  changeCurrentUserPassword,
  type CurrentUserBillingSummary,
  deleteCurrentUser,
  getCurrentUserBilling,
  getCurrentUser,
  getCurrentUserNotificationPreferences,
  type NotificationPreferences,
  updateCurrentUser,
  updateCurrentUserBilling,
  updateCurrentUserBillingAutoRenew,
  updateCurrentUserNotificationPreferences,
} from "..";

const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  expenseAdded: false,
  paymentReceived: false,
  settlementReminder: false,
  weeklyDigest: false,
  groupInvites: false,
  marketingEmails: false,
};

const DEFAULT_BILLING_SUMMARY: CurrentUserBillingSummary = {
  profile: {
    plan: "free",
    status: "active",
    autoRenew: false,
    updatedAt: new Date(0).toISOString(),
  },
  usage: {
    groupCount: 0,
    groupLimit: 3,
    expenseCount: 0,
    expenseLimit: 10,
    receiptScanIncluded: false,
  },
};

const MAX_AVATAR_FILE_SIZE_BYTES = 2 * 1024 * 1024;
const SUPPORTED_AVATAR_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }

      reject(new Error("Unable to read avatar."));
    };

    reader.onerror = () => {
      reject(new Error("Unable to read avatar."));
    };

    reader.readAsDataURL(file);
  });
}

function isDataUrl(value: string) {
  return value.trim().startsWith("data:");
}

const ACCENT_COLOR_OPTIONS: { color: string; value: AccentColor }[] = [
  { color: "#16A34A", value: "green" },
  { color: "#2563EB", value: "blue" },
  { color: "#7C3AED", value: "violet" },
  { color: "#DB2777", value: "pink" },
  { color: "#D97706", value: "amber" },
  { color: "#DC2626", value: "red" },
];

export function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [saved, setSaved] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isLoadingNotifications, setIsLoadingNotifications] = useState(true);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isLoadingBilling, setIsLoadingBilling] = useState(true);
  const [isUpdatingBilling, setIsUpdatingBilling] = useState(false);
  const [isAppearanceReady, setIsAppearanceReady] = useState(false);
  const [appearanceSaved, setAppearanceSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [notificationErrorMessage, setNotificationErrorMessage] = useState("");
  const [notificationSuccessMessage, setNotificationSuccessMessage] = useState("");
  const [passwordErrorMessage, setPasswordErrorMessage] = useState("");
  const [passwordSuccessMessage, setPasswordSuccessMessage] = useState("");
  const [billingErrorMessage, setBillingErrorMessage] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [avatarUrlInput, setAvatarUrlInput] = useState("");
  const [currency, setCurrency] = useState<"USD" | "VND">("USD");
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const { lang, setLang, t } = useLanguage();
  const navigate = useNavigate();
  const currentUser = useStoredUser();
  const { setTheme, theme } = useTheme();
  const { accentColor, density, setAccentColor, setDensity } = useAppearance();
  const { confirm, showToast } = useFeedback();

  const [notifs, setNotifs] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES,
  );
  const [billingSummary, setBillingSummary] = useState<CurrentUserBillingSummary>(
    DEFAULT_BILLING_SUMMARY,
  );
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (currentUser) {
      setFirstName(currentUser.firstName);
      setLastName(currentUser.lastName);
      setEmail(currentUser.email);
      setBio(currentUser.bio);
      setAvatarUrl(currentUser.avatarUrl);
      setAvatarUrlInput(isDataUrl(currentUser.avatarUrl) ? "" : currentUser.avatarUrl);
      setCurrency(currentUser.defaultCurrency === "VND" ? "VND" : "USD");
    }
  }, [currentUser]);

  useEffect(() => {
    setIsAppearanceReady(true);
  }, []);

  useEffect(() => {
    async function loadProfile() {
      try {
        const [profileResult, notificationsResult, billingResult] =
          await Promise.allSettled([
            getCurrentUser(),
            getCurrentUserNotificationPreferences(),
            getCurrentUserBilling(),
          ]);

        if (profileResult.status === "fulfilled" && profileResult.value.user) {
          setFirstName(profileResult.value.user.firstName);
          setLastName(profileResult.value.user.lastName);
          setEmail(profileResult.value.user.email);
          setBio(profileResult.value.user.bio);
          setAvatarUrl(profileResult.value.user.avatarUrl);
          setAvatarUrlInput(
            isDataUrl(profileResult.value.user.avatarUrl)
              ? ""
              : profileResult.value.user.avatarUrl,
          );
          setCurrency(
            profileResult.value.user.defaultCurrency === "VND" ? "VND" : "USD",
          );
          setStoredUser(profileResult.value.user);
        } else if (profileResult.status === "rejected") {
          setErrorMessage(
            profileResult.reason instanceof Error
              ? profileResult.reason.message
              : t.loadProfileError,
          );
        }

        if (
          notificationsResult.status === "fulfilled" &&
          notificationsResult.value.notificationPreferences
        ) {
          setNotifs(notificationsResult.value.notificationPreferences);
        } else if (notificationsResult.status === "rejected") {
          setNotificationErrorMessage(
            notificationsResult.reason instanceof Error
              ? notificationsResult.reason.message
              : t.loadNotificationsError,
          );
        }

        if (billingResult.status === "fulfilled" && billingResult.value.billing) {
          setBillingSummary(billingResult.value.billing);
        } else if (billingResult.status === "rejected") {
          setBillingErrorMessage(
            billingResult.reason instanceof Error
              ? billingResult.reason.message
              : t.loadBillingError,
          );
        }

      } finally {
        setIsLoadingProfile(false);
        setIsLoadingNotifications(false);
        setIsLoadingBilling(false);
      }
    }

    void loadProfile();
  }, [t]);

  const handleSave = async () => {
    setErrorMessage("");

    if (!firstName.trim()) {
      setErrorMessage(t.firstNameRequired);
      return;
    }

    if (!lastName.trim()) {
      setErrorMessage(t.lastNameRequired);
      return;
    }

    try {
      setIsSavingProfile(true);

      const response = await updateCurrentUser({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        bio: bio.trim(),
        avatarUrl: avatarUrl.trim(),
        defaultCurrency: currency,
      });

      if (response.user) {
        setStoredUser(response.user);
      }

      setSaved(true);
      window.setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : t.saveProfileError,
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSignOut = () => {
    clearStoredUser();
    navigate("/login");
  };

  const handleAvatarUploadClick = () => {
    avatarInputRef.current?.click();
  };

  const handleAvatarFileChange = async (
    event: ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];

    setErrorMessage("");

    if (!file) {
      return;
    }

    if (!SUPPORTED_AVATAR_MIME_TYPES.has(file.type)) {
      setErrorMessage(t.avatarTypeError);
      event.target.value = "";
      return;
    }

    if (file.size > MAX_AVATAR_FILE_SIZE_BYTES) {
      setErrorMessage(t.avatarSizeError);
      event.target.value = "";
      return;
    }

    try {
      const nextAvatarUrl = await readFileAsDataUrl(file);
      setAvatarUrl(nextAvatarUrl);
      setAvatarUrlInput("");
    } catch {
      setErrorMessage(t.avatarReadError);
    } finally {
      event.target.value = "";
    }
  };

  const handleDeleteAccount = async () => {
    const confirmed = await confirm({
      title: t.deleteAccountTitle ?? t.deleteAccount,
      message: `${t.deleteAccount}? ${t.deleteAccountDesc ?? t.deleteUserDesc}`,
      cancelLabel: t.cancel,
      confirmLabel: t.deleteAccount,
      variant: "danger",
    });

    if (!confirmed) {
      return;
    }

    try {
      setIsDeletingAccount(true);
      const response = await deleteCurrentUser();

      clearStoredUser();
      showToast({
        variant: "success",
        message: response.message,
      });
      navigate("/login");
    } catch (error) {
      showToast({
        variant: "error",
        message: error instanceof Error ? error.message : t.deleteAccountError,
      });
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordErrorMessage("");
    setPasswordSuccessMessage("");

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setPasswordErrorMessage(t.passwordRequired);
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordErrorMessage(t.passwordMinLength);
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      setPasswordErrorMessage(t.passwordsDoNotMatch);
      return;
    }

    try {
      setIsSavingPassword(true);

      const response = await changeCurrentUserPassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setPasswordSuccessMessage(response.message);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmNewPassword: "",
      });
    } catch (error) {
      setPasswordErrorMessage(
        error instanceof Error ? error.message : t.updatePasswordError,
      );
    } finally {
      setIsSavingPassword(false);
    }
  };

  const handleNotificationSave = async () => {
    setNotificationErrorMessage("");
    setNotificationSuccessMessage("");

    try {
      setIsSavingNotifications(true);

      const response = await updateCurrentUserNotificationPreferences({
        notificationPreferences: notifs,
      });

      if (response.notificationPreferences) {
        setNotifs(response.notificationPreferences);
      }

      setNotificationSuccessMessage(response.message);
      window.setTimeout(() => setNotificationSuccessMessage(""), 2000);
    } catch (error) {
      setNotificationErrorMessage(
        error instanceof Error
          ? error.message
          : t.saveNotificationsError,
      );
    } finally {
      setIsSavingNotifications(false);
    }
  };

  const handleUpgradePlan = async () => {
    setBillingErrorMessage("");

    try {
      setIsUpdatingBilling(true);
      const response = await createVnpayBillingPayment();

      if (!response.paymentUrl) {
        throw new Error("VNPay payment URL was not returned.");
      }

      window.location.href = response.paymentUrl;
    } catch (error) {
      const message = error instanceof Error ? error.message : t.updateBillingError;

      setBillingErrorMessage(message);
      showToast({
        variant: "error",
        message,
      });
    } finally {
      setIsUpdatingBilling(false);
    }
  };

  const handleCancelPlan = async () => {
    setBillingErrorMessage("");

    const confirmed = await confirm({
      title: t.cancelPlan,
      message: t.cancelPlanDesc,
      cancelLabel: t.cancel,
      confirmLabel: t.cancelPlan,
      variant: "danger",
    });

    if (!confirmed) {
      return;
    }

    try {
      setIsUpdatingBilling(true);

      const response = await updateCurrentUserBilling({
        plan: "free",
      });

      if (response.billing) {
        setBillingSummary(response.billing);
      }

      showToast({
        variant: "success",
        message: response.message,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : t.updateBillingError;

      setBillingErrorMessage(message);
      showToast({
        variant: "error",
        message,
      });
    } finally {
      setIsUpdatingBilling(false);
    }
  };

  const handleToggleAutoRenew = async () => {
    setBillingErrorMessage("");

    try {
      setIsUpdatingBilling(true);

      const response = await updateCurrentUserBillingAutoRenew({
        autoRenew: !billingSummary.profile.autoRenew,
      });

      if (response.billing) {
        setBillingSummary(response.billing);
      }

      showToast({
        variant: "success",
        message: response.message,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : t.updateBillingError;

      setBillingErrorMessage(message);
      showToast({
        variant: "error",
        message,
      });
    } finally {
      setIsUpdatingBilling(false);
    }
  };

  const showAppearanceSavedState = () => {
    setAppearanceSaved(true);
    window.setTimeout(() => setAppearanceSaved(false), 1500);
  };

  const handleThemeChange = (nextTheme: "light" | "dark" | "system") => {
    setTheme(nextTheme);
    showAppearanceSavedState();
  };

  const handleAccentColorChange = (nextAccentColor: AccentColor) => {
    setAccentColor(nextAccentColor);
    showAppearanceSavedState();
  };

  const handleDensityChange = (
    nextDensity: "compact" | "default" | "comfortable",
  ) => {
    setDensity(nextDensity);
    showAppearanceSavedState();
  };

  const handleLanguageChange = (nextLanguage: "en" | "vi") => {
    setLang(nextLanguage);
    showAppearanceSavedState();
  };

  const initials = avatarUrl.trim()
    ? ""
    : getUserInitials({
        firstName: firstName || "?",
        lastName: lastName || "?",
      });

  const tabs = [
    { id: "profile", label: t.profile, icon: User },
    { id: "notifications", label: t.notifications, icon: Bell },
    { id: "security", label: t.security, icon: Shield },
    { id: "billing", label: t.billing, icon: CreditCard },
    { id: "appearance", label: t.appearance, icon: Palette },
  ];

  const currentBillingPlan = billingSummary.profile.plan;
  const isProPlan = currentBillingPlan === "pro";
  const billingPlanLabel = isProPlan ? t.pro : t.free;
  const billingPlanDescription = isProPlan
    ? t.billingProDesc
    : t.onFreePlan;
  const billingActionLabel = isProPlan ? t.proActive : t.upgradePro;
  const billingCurrency = currency;
  const billingPriceLabel =
    billingCurrency === "VND" ? "99,000 VND/mo" : "$4/mo";
  const formatUsageValue = (used: number, limit: number | null) =>
    limit === null ? `${used} / ${t.unlimited}` : `${used} / ${limit}`;
  const receiptScanValue = billingSummary.usage.receiptScanIncluded
    ? t.included
    : t.notIncluded;
  const autoRenewEnabled = billingSummary.profile.autoRenew;
  const currentPlanLimits = isProPlan
    ? [
        "Unlimited groups",
        "Unlimited expenses",
        "Receipt scan included",
      ]
    : [
        `Groups limited to ${billingSummary.usage.groupLimit ?? 0}`,
        `Expenses limited to ${billingSummary.usage.expenseLimit ?? 0} per month`,
        "Receipt scan not included",
      ];
  const proBenefits = [
    billingSummary.profile.plan === "pro"
      ? `Unlimited groups and expenses`
      : `Unlimited groups and expenses after upgrade`,
    billingSummary.profile.plan === "pro"
      ? `Receipt scan is included`
      : `Receipt scan unlocks with Pro`,
  ];

  return (
    <div className="lg:pl-60 min-h-screen bg-[#F6FBF8]">
      <div className="max-w-7xl mx-auto px-6 py-6 pt-16 lg:pt-6">
        <div className="mb-6">
          <h1
            className="text-[#111827]"
            style={{ fontSize: "1.5rem", fontWeight: 800 }}
          >
            {t.settingsTitle}
          </h1>
          <p className="text-[#6B7280] text-sm mt-0.5">{t.settingsDesc}</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-5">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 text-center">
              {avatarUrl.trim() ? (
                <img
                  src={avatarUrl}
                  alt={t.userAvatarAlt}
                  className="mx-auto rounded-2xl object-cover"
                  style={{ width: "5.5rem", height: "5.5rem" }}
                />
              ) : (
                <div
                  className="mx-auto rounded-2xl bg-[#7EDDBA] flex items-center justify-center text-[#065f46]"
                  style={{
                    fontWeight: 800,
                    fontSize: "1.5rem",
                    width: "5.5rem",
                    height: "5.5rem",
                  }}
                >
                  {initials}
                </div>
              )}

              <p
                className="text-[#111827] mt-3"
                style={{ fontWeight: 700, fontSize: "1.05rem" }}
              >
                {firstName || lastName ? `${firstName} ${lastName}`.trim() : "-"}
              </p>

              <span
                className={`inline-block mt-2 rounded-full px-2.5 py-1 text-xs ${
                  currentUser?.role === "admin"
                    ? "bg-[#FEE2E2] text-[#991B1B]"
                    : "bg-[#EFF6FF] text-[#1D4ED8]"
                }`}
                style={{ fontWeight: 600 }}
              >
                {currentUser?.role ?? "user"}
              </span>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="rounded-xl bg-[#F9FAFB] py-3">
                  <p className="text-[#111827]" style={{ fontWeight: 700 }}>
                    {billingSummary.usage.groupCount}
                  </p>
                  <p className="text-xs text-[#6B7280] mt-0.5">{t.groups}</p>
                </div>
                <div className="rounded-xl bg-[#F9FAFB] py-3">
                  <p className="text-[#111827]" style={{ fontWeight: 700 }}>
                    {billingSummary.usage.expenseCount}
                  </p>
                  <p className="text-xs text-[#6B7280] mt-0.5">{t.expenses}</p>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-[#F3F4F6] text-left">
                <p
                  className="text-sm text-[#111827] mb-3"
                  style={{ fontWeight: 700 }}
                >
                  {t.profileInfo}
                </p>
                <div className="space-y-3 text-sm">
                  <div>
                    <p className="text-xs text-[#9CA3AF]">{t.emailAddress}</p>
                    <p className="text-[#111827] truncate" style={{ fontWeight: 500 }}>
                      {email || "-"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[#9CA3AF]">{t.defaultCurrency}</p>
                    <p className="text-[#111827]" style={{ fontWeight: 500 }}>
                      {currency}
                    </p>
                  </div>
                  {currentUser && (
                    <div>
                      <p className="text-xs text-[#9CA3AF]">{t.joinedOn}</p>
                      <p className="text-[#111827]" style={{ fontWeight: 500 }}>
                        {formatLocalDate(currentUser.createdAt)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={handleSignOut}
                className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-sm text-[#EF4444] hover:bg-[#FEF2F2] transition-colors mt-5 border-t border-[#F3F4F6] pt-4"
                style={{ fontWeight: 500 }}
              >
                <LogOut className="w-4 h-4" />
                {t.signOut}
              </button>
            </div>
          </div>

          <div className="lg:col-span-3">
            <div className="flex flex-wrap items-center gap-2 bg-white rounded-2xl border border-[#E5E7EB] p-2 mb-5">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all ${activeTab === id ? "bg-[#16A34A] text-white shadow-sm" : "text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#111827]"}`}
                  style={{ fontWeight: activeTab === id ? 600 : 500 }}
                >
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 ${activeTab === id ? "text-white" : "text-[#9CA3AF]"}`}
                  />
                  {label}
                </button>
              ))}
            </div>

            {activeTab === "profile" && (
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
                <h2
                  className="text-[#111827] mb-5"
                  style={{ fontWeight: 700, fontSize: "1rem" }}
                >
                  {t.profileInfo}
                </h2>
                <div className="flex items-center gap-5 mb-7 pb-6 border-b border-[#F3F4F6]">
                  <div className="relative">
                    {avatarUrl.trim() ? (
                      <img
                        src={avatarUrl}
                        alt={t.userAvatarAlt}
                        className="rounded-2xl object-cover"
                        style={{ width: "4.5rem", height: "4.5rem" }}
                      />
                    ) : (
                      <div
                        className="rounded-2xl bg-[#7EDDBA] flex items-center justify-center text-[#065f46]"
                        style={{
                          fontWeight: 800,
                          fontSize: "1.25rem",
                          width: "4.5rem",
                          height: "4.5rem",
                        }}
                      >
                        {initials}
                      </div>
                    )}
                    <button
                      type="button"
                      aria-label={t.uploadPhoto}
                      onClick={handleAvatarUploadClick}
                      className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#16A34A] rounded-xl flex items-center justify-center shadow-sm transition-colors hover:bg-[#15803d]"
                    >
                      <Camera className="w-3.5 h-3.5 text-white" />
                    </button>
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/webp"
                      data-testid="avatar-upload-input"
                      onChange={(event) => void handleAvatarFileChange(event)}
                      className="hidden"
                    />
                  </div>
                  <div>
                    <p
                      className="text-[#374151] text-sm"
                      style={{ fontWeight: 600 }}
                    >
                      {firstName || lastName
                        ? `${firstName} ${lastName}`.trim()
                        : "-"}
                    </p>
                    <p className="text-[#9CA3AF] text-xs mt-0.5">
                      {email || "-"}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      <button
                        type="button"
                        onClick={handleAvatarUploadClick}
                        className="text-xs text-[#16A34A] hover:underline"
                        style={{ fontWeight: 600 }}
                      >
                        {t.uploadPhoto}
                      </button>
                      {avatarUrl.trim() && (
                        <button
                          type="button"
                          onClick={() => {
                            setAvatarUrl("");
                            setAvatarUrlInput("");
                          }}
                          className="text-xs text-[#EF4444] hover:underline flex items-center gap-1"
                          style={{ fontWeight: 500 }}
                        >
                          <Trash2 className="w-3 h-3" />
                          {t.removePhoto}
                        </button>
                      )}
                    </div>
                    <p className="text-[#9CA3AF] text-xs mt-1.5">
                      {t.avatarUploadHint}
                    </p>
                    {avatarUrl.trim() && isDataUrl(avatarUrl) && (
                      <p className="text-[#16A34A] text-xs mt-1">
                        {t.avatarUploadedState}
                      </p>
                    )}
                  </div>
                </div>

                {errorMessage && (
                  <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C] mb-5">
                    {errorMessage}
                  </div>
                )}

                {isLoadingProfile && (
                  <div className="rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3 text-sm text-[#166534] mb-5">
                    {t.loadingProfile}
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-5 mb-5">
                  <div>
                    <label
                      className="block text-sm text-[#374151] mb-1.5"
                      style={{ fontWeight: 600 }}
                    >
                      {t.firstName}
                    </label>
                    <input
                      type="text"
                      placeholder={t.firstNamePlaceholder}
                      value={firstName}
                      onChange={(event) => setFirstName(event.target.value)}
                      className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#7EDDBA] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label
                      className="block text-sm text-[#374151] mb-1.5"
                      style={{ fontWeight: 600 }}
                    >
                      {t.lastName}
                    </label>
                    <input
                      type="text"
                      placeholder={t.lastNamePlaceholder}
                      value={lastName}
                      onChange={(event) => setLastName(event.target.value)}
                      className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#7EDDBA] focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="mb-5">
                  <label
                    className="block text-sm text-[#374151] mb-1.5"
                    style={{ fontWeight: 600 }}
                  >
                    {t.emailAddress}
                  </label>
                  <input
                    type="email"
                    placeholder={t.emailPlaceholder}
                    value={email}
                    readOnly
                    className="w-full bg-[#F3F4F6] border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm text-[#6B7280] focus:outline-none cursor-not-allowed"
                  />
                </div>

                <div className="mb-5">
                  <label
                    className="block text-sm text-[#374151] mb-1.5"
                    style={{ fontWeight: 600 }}
                  >
                    {t.bio}
                  </label>
                  <textarea
                    rows={3}
                    placeholder={t.bioPaceholder}
                    value={bio}
                    onChange={(event) => setBio(event.target.value)}
                    className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-2 focus:ring-[#7EDDBA] focus:border-transparent resize-none"
                  />
                </div>

                <div className="mb-5">
                  <label
                    className="block text-sm text-[#374151] mb-1.5"
                    style={{ fontWeight: 600 }}
                  >
                    {t.avatarUrlLabel}
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/avatar.png"
                    value={avatarUrlInput}
                    onChange={(event) => {
                      setAvatarUrlInput(event.target.value);
                      setAvatarUrl(event.target.value);
                    }}
                    className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#7EDDBA] focus:border-transparent"
                  />
                </div>

                <div className="mb-6">
                  <label
                    className="block text-sm text-[#374151] mb-1.5"
                    style={{ fontWeight: 600 }}
                  >
                    {t.defaultCurrency}
                  </label>
                  <select
                    value={currency}
                    onChange={(event) =>
                      setCurrency(event.target.value as "USD" | "VND")
                    }
                    className="w-full sm:w-56 bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#7EDDBA] appearance-none"
                  >
                    <option value="USD">USD - US Dollar</option>
                    <option value="VND">VND - Vietnamese Dong</option>
                  </select>
                </div>

                <button
                  onClick={() => void handleSave()}
                  disabled={isSavingProfile || isLoadingProfile}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm transition-all shadow-sm disabled:cursor-not-allowed disabled:opacity-70 ${saved ? "bg-[#D1FAE5] text-[#16A34A]" : "bg-[#16A34A] text-white hover:bg-[#15803d]"}`}
                  style={{ fontWeight: 600 }}
                >
                  {saved ? (
                    <>
                      <Check className="w-4 h-4" />
                      {t.saved}
                    </>
                  ) : isSavingProfile ? (
                    t.saving
                  ) : (
                    t.saveChanges
                  )}
                </button>
              </div>
            )}

            {activeTab === "notifications" && (
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
                <h2
                  className="text-[#111827] mb-5"
                  style={{ fontWeight: 700, fontSize: "1rem" }}
                >
                  {t.notificationPrefs}
                </h2>
                {notificationErrorMessage && (
                  <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C] mb-5">
                    {notificationErrorMessage}
                  </div>
                )}
                {notificationSuccessMessage && (
                  <div className="rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3 text-sm text-[#166534] mb-5">
                    {notificationSuccessMessage}
                  </div>
                )}
                {isLoadingNotifications && (
                  <div className="rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3 text-sm text-[#166534] mb-5">
                    {t.loadingNotifications}
                  </div>
                )}
                <div>
                  {([
                    {
                      key: "expenseAdded",
                      label: t.expenseAdded,
                      desc: t.expenseAddedDesc,
                    },
                    {
                      key: "paymentReceived",
                      label: t.paymentReceived,
                      desc: t.paymentReceivedDesc,
                    },
                    {
                      key: "settlementReminder",
                      label: t.settlementReminder,
                      desc: t.settlementReminderDesc,
                    },
                    {
                      key: "weeklyDigest",
                      label: t.weeklyDigest,
                      desc: t.weeklyDigestDesc,
                    },
                    {
                      key: "groupInvites",
                      label: t.groupInvitesLabel,
                      desc: t.groupInvitesDesc,
                    },
                    {
                      key: "marketingEmails",
                      label: t.marketingEmails,
                      desc: t.marketingEmailsDesc,
                    },
                  ] as {
                    key: keyof typeof notifs;
                    label: string;
                    desc: string;
                  }[]).map(({ key, label, desc }) => (
                    <div
                      key={key}
                      className="flex items-center justify-between py-4 border-b border-[#F3F4F6] last:border-0"
                    >
                      <div>
                        <p
                          className="text-sm text-[#111827]"
                          style={{ fontWeight: 600 }}
                        >
                          {label}
                        </p>
                        <p className="text-xs text-[#9CA3AF] mt-0.5">{desc}</p>
                      </div>
                      <button
                        onClick={() =>
                          setNotifs((prev) => ({ ...prev, [key]: !prev[key] }))
                        }
                        disabled={isLoadingNotifications || isSavingNotifications}
                        className={`w-11 h-6 rounded-full transition-colors flex-shrink-0 relative ${notifs[key] ? "bg-[#16A34A]" : "bg-[#D1D5DB]"}`}
                      >
                        <div
                          className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${notifs[key] ? "translate-x-5" : "translate-x-0.5"}`}
                        />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => void handleNotificationSave()}
                  disabled={isLoadingNotifications || isSavingNotifications}
                  className="mt-5 bg-[#16A34A] text-white px-6 py-2.5 rounded-xl text-sm hover:bg-[#15803d] transition-colors shadow-sm disabled:cursor-not-allowed disabled:opacity-70"
                  style={{ fontWeight: 600 }}
                >
                  {isSavingNotifications ? t.saving : t.saveChanges}
                </button>
              </div>
            )}

            {activeTab === "security" && (
              <div className="space-y-5">
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
                  <h2
                    className="text-[#111827] mb-5"
                    style={{ fontWeight: 700, fontSize: "1rem" }}
                  >
                    {t.changePassword}
                  </h2>
                  {passwordErrorMessage && (
                    <div className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm text-[#B91C1C] mb-4 max-w-sm">
                      {passwordErrorMessage}
                    </div>
                  )}
                  {passwordSuccessMessage && (
                    <div className="rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3 text-sm text-[#166534] mb-4 max-w-sm">
                      {passwordSuccessMessage}
                    </div>
                  )}
                  <div className="space-y-4 max-w-sm">
                    <div>
                      <label
                        className="block text-sm text-[#374151] mb-1.5"
                        style={{ fontWeight: 600 }}
                      >
                        {t.currentPassword}
                      </label>
                      <input
                        type="password"
                        placeholder="........"
                        value={passwordForm.currentPassword}
                        onChange={(event) =>
                          setPasswordForm((prev) => ({
                            ...prev,
                            currentPassword: event.target.value,
                          }))
                        }
                        className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#7EDDBA] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label
                        className="block text-sm text-[#374151] mb-1.5"
                        style={{ fontWeight: 600 }}
                      >
                        {t.newPassword}
                      </label>
                      <input
                        type="password"
                        placeholder="........"
                        value={passwordForm.newPassword}
                        onChange={(event) =>
                          setPasswordForm((prev) => ({
                            ...prev,
                            newPassword: event.target.value,
                          }))
                        }
                        className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#7EDDBA] focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label
                        className="block text-sm text-[#374151] mb-1.5"
                        style={{ fontWeight: 600 }}
                      >
                        {t.confirmNewPassword}
                      </label>
                      <input
                        type="password"
                        placeholder="........"
                        value={passwordForm.confirmNewPassword}
                        onChange={(event) =>
                          setPasswordForm((prev) => ({
                            ...prev,
                            confirmNewPassword: event.target.value,
                          }))
                        }
                        className="w-full bg-[#F9FAFB] border border-[#E5E7EB] rounded-xl px-4 py-3 text-sm text-[#111827] focus:outline-none focus:ring-2 focus:ring-[#7EDDBA] focus:border-transparent"
                      />
                    </div>
                    <button
                      onClick={() => void handlePasswordChange()}
                      disabled={isSavingPassword}
                      className="bg-[#16A34A] text-white px-6 py-2.5 rounded-xl text-sm hover:bg-[#15803d] transition-colors"
                      style={{ fontWeight: 600 }}
                >
                      {isSavingPassword ? t.saving : t.updatePassword}
                    </button>
                  </div>
                </div>
                <div className="bg-[#FEF2F2] rounded-2xl border border-[#FEE2E2] p-6">
                  <h2
                    className="text-[#991b1b] mb-1"
                    style={{ fontWeight: 700, fontSize: "1rem" }}
                  >
                    {t.dangerZone}
                  </h2>
                  <p className="text-[#6B7280] text-sm mb-4">
                    {t.dangerZoneDesc}
                  </p>
                  <button
                    onClick={() => void handleDeleteAccount()}
                    disabled={isDeletingAccount}
                    className="flex items-center gap-2 bg-white text-[#EF4444] border border-[#FCA5A5] px-4 py-2.5 rounded-xl text-sm hover:bg-[#FEF2F2] transition-colors"
                    style={{ fontWeight: 600 }}
                  >
                    <Trash2 className="w-4 h-4" />
                    {isDeletingAccount
                      ? (t.deletingAccount ?? t.deleting)
                      : t.deleteAccount}
                  </button>
                </div>
              </div>
            )}

            {activeTab === "billing" && (
              <div className="space-y-5">
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
                  <h2
                    className="text-[#111827] mb-4"
                    style={{ fontWeight: 700, fontSize: "1rem" }}
                  >
                    {t.currentPlan}
                  </h2>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <p className="text-sm text-[#6B7280]">{billingPlanLabel}</p>
                        <p className="text-[#111827] mt-1" style={{ fontWeight: 700 }}>
                          {billingPriceLabel}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-[#6B7280]">{t.groupsUsed}</p>
                        <p className="text-[#111827] mt-1" style={{ fontWeight: 700 }}>
                          {formatUsageValue(
                            billingSummary.usage.groupCount,
                            billingSummary.usage.groupLimit,
                          )}
                        </p>
                      </div>
                    </div>
                    <p className="text-sm text-[#374151]">{billingPlanDescription}</p>
                    <div className="rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-4">
                      <p className="text-sm text-[#111827]" style={{ fontWeight: 700 }}>
                        {t.currentPlan}
                      </p>
                      <ul className="mt-3 space-y-2 text-sm text-[#374151]">
                        {currentPlanLimits.map((limitText) => (
                          <li key={limitText} className="flex items-start gap-2">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#16A34A]" />
                            <span>{limitText}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-4">
                      <p className="text-sm text-[#111827]" style={{ fontWeight: 700 }}>
                        {isProPlan ? "What Pro includes" : "What you'll get with Pro"}
                      </p>
                      <ul className="mt-3 space-y-2 text-sm text-[#374151]">
                        {proBenefits.map((benefit) => (
                          <li key={benefit} className="flex items-start gap-2">
                            <Check className="mt-0.5 h-4 w-4 shrink-0 text-[#16A34A]" />
                            <span>{benefit}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="rounded-2xl border border-[#E5E7EB] bg-[#F9FAFB] p-4">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm text-[#111827]" style={{ fontWeight: 700 }}>
                            {t.autoRenew}
                          </p>
                          <p className="text-xs text-[#6B7280] mt-1">{t.autoRenewDesc}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => void handleToggleAutoRenew()}
                          disabled={isLoadingBilling || isUpdatingBilling || !isProPlan}
                          aria-pressed={autoRenewEnabled}
                          className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${autoRenewEnabled ? "bg-[#16A34A]" : "bg-[#D1D5DB]"}`}
                        >
                          <span
                            className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${autoRenewEnabled ? "translate-x-7" : "translate-x-1"}`}
                          />
                        </button>
                      </div>
                      <p className="text-xs text-[#6B7280] mt-3">
                        {autoRenewEnabled ? t.autoRenewEnabled : t.autoRenewDisabled}
                      </p>
                      {!isProPlan && (
                        <p className="text-xs text-[#B45309] mt-2">
                          Auto-renew is available only while Pro is active.
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => void handleUpgradePlan()}
                      disabled={isLoadingBilling || isUpdatingBilling || isProPlan}
                      className="bg-[#16A34A] text-white px-6 py-2.5 rounded-xl text-sm hover:bg-[#15803d] transition-colors shadow-sm"
                      style={{ fontWeight: 600 }}
                    >
                      {isUpdatingBilling ? t.updatingPlan : billingActionLabel}
                    </button>
                    {isProPlan && (
                      <button
                        onClick={() => void handleCancelPlan()}
                        disabled={isLoadingBilling || isUpdatingBilling}
                        className="ml-3 border border-[#FCA5A5] text-[#B91C1C] px-6 py-2.5 rounded-xl text-sm hover:bg-[#FEF2F2] transition-colors disabled:cursor-not-allowed disabled:opacity-60"
                        style={{ fontWeight: 600 }}
                      >
                        {isUpdatingBilling ? t.updatingPlan : t.cancelPlan}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "appearance" && (
              <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
                <h2
                  className="text-[#111827] mb-5"
                  style={{ fontWeight: 700, fontSize: "1rem" }}
                >
                  {t.appearanceTitle}
                </h2>
                {appearanceSaved && (
                  <div className="rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] px-4 py-3 text-sm text-[#166534] mb-5">
                    {t.saved}
                  </div>
                )}
                <div className="mb-6">
                  <p
                    className="text-sm text-[#374151] mb-3"
                    style={{ fontWeight: 600 }}
                  >
                    {t.language}
                  </p>
                  <div className="flex flex-wrap items-center gap-2">
                    {[
                      { label: t.english, value: "en" as const },
                      { label: t.vietnamese, value: "vi" as const },
                    ].map(({ label, value }) => (
                      <button
                        key={value}
                        onClick={() => handleLanguageChange(value)}
                        className={`px-4 py-2 rounded-xl border text-sm transition-all ${lang === value ? "bg-[#F0FAF5] border-[#7EDDBA] text-[#16A34A]" : "border-[#E5E7EB] text-[#6B7280] hover:border-[#7EDDBA]"}`}
                        style={{ fontWeight: 500 }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mb-6">
                  <p
                    className="text-sm text-[#374151] mb-3"
                    style={{ fontWeight: 600 }}
                  >
                    {t.theme}
                  </p>
                  <div className="grid grid-cols-3 gap-3 max-w-xs">
                    {[
                      { label: t.light, bg: "#F6FBF8", value: "light" as const },
                      { label: t.dark, bg: "#111827", value: "dark" as const },
                      {
                        label: t.system,
                        bg: "linear-gradient(135deg, #F6FBF8 50%, #111827 50%)",
                        value: "system" as const,
                      },
                    ].map(({ label, bg, value }) => {
                      const selected = (theme ?? "system") === value;

                      return (
                      <button
                        key={label}
                        onClick={() => handleThemeChange(value)}
                        className={`rounded-xl border-2 p-3 text-center transition-all ${selected ? "border-[#16A34A]" : "border-[#E5E7EB] hover:border-[#7EDDBA]"}`}
                        disabled={!isAppearanceReady}
                      >
                        <div
                          className="w-full h-10 rounded-lg mb-2"
                          style={{ background: bg }}
                        />
                        <p
                          className="text-xs text-[#374151]"
                          style={{ fontWeight: 500 }}
                        >
                          {label}
                        </p>
                        {selected && (
                          <Check className="w-3.5 h-3.5 text-[#16A34A] mx-auto mt-1" />
                        )}
                      </button>
                      );
                    })}
                  </div>
                </div>
                <div className="mb-6">
                  <p
                    className="text-sm text-[#374151] mb-3"
                    style={{ fontWeight: 600 }}
                  >
                    {t.accentColor}
                  </p>
                  <div className="flex items-center gap-3">
                    {ACCENT_COLOR_OPTIONS.map(({ color, value }) => (
                      <button
                        key={color}
                        onClick={() => handleAccentColorChange(value)}
                        className={`w-8 h-8 rounded-full transition-transform hover:scale-110 ${accentColor === value ? "ring-2 ring-offset-2 ring-[#16A34A]" : ""}`}
                        style={{ background: color }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <p
                    className="text-sm text-[#374151] mb-3"
                    style={{ fontWeight: 600 }}
                  >
                    {t.density}
                  </p>
                  <div className="flex items-center gap-2">
                    {[
                      { label: t.compact, value: "compact" as const },
                      { label: t.default, value: "default" as const },
                      { label: t.comfortable, value: "comfortable" as const },
                    ].map(({ label, value }) => (
                      <button
                        key={label}
                        onClick={() => handleDensityChange(value)}
                        className={`px-4 py-2 rounded-xl border text-sm transition-all ${density === value ? "bg-[#F0FAF5] border-[#7EDDBA] text-[#16A34A]" : "border-[#E5E7EB] text-[#6B7280] hover:border-[#7EDDBA]"}`}
                        style={{ fontWeight: 500 }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}