import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { useNavigate } from "react-router";
import {
  User,
  Bell,
  Shield,
  CreditCard,
  Palette,
  ChevronRight,
  Check,
  Camera,
  Trash2,
  LogOut,
} from "lucide-react";
import { useLanguage } from "../../../shared/providers/LanguageProvider";
import {
  type AccentColor,
  useAppearance,
} from "../../../shared/providers/AppearanceProvider";
import {
  clearStoredUser,
  getUserInitials,
  setStoredUser,
  useStoredUser,
} from "../../auth";
import {
  changeCurrentUserPassword,
  getCurrentUser,
  getCurrentUserNotificationPreferences,
  type NotificationPreferences,
  updateCurrentUser,
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
  const [isAppearanceReady, setIsAppearanceReady] = useState(false);
  const [appearanceSaved, setAppearanceSaved] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [notificationErrorMessage, setNotificationErrorMessage] = useState("");
  const [notificationSuccessMessage, setNotificationSuccessMessage] = useState("");
  const [passwordErrorMessage, setPasswordErrorMessage] = useState("");
  const [passwordSuccessMessage, setPasswordSuccessMessage] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [currency, setCurrency] = useState<"USD" | "VND">("USD");
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmNewPassword: "",
  });
  const { t } = useLanguage();
  const navigate = useNavigate();
  const currentUser = useStoredUser();
  const { setTheme, theme } = useTheme();
  const { accentColor, density, setAccentColor, setDensity } = useAppearance();

  const [notifs, setNotifs] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES,
  );

  useEffect(() => {
    if (currentUser) {
      setFirstName(currentUser.firstName);
      setLastName(currentUser.lastName);
      setEmail(currentUser.email);
      setBio(currentUser.bio);
      setAvatarUrl(currentUser.avatarUrl);
      setCurrency(currentUser.defaultCurrency === "VND" ? "VND" : "USD");
    }
  }, [currentUser]);

  useEffect(() => {
    setIsAppearanceReady(true);
  }, []);

  useEffect(() => {
    async function loadProfile() {
      try {
        const [profileResult, notificationsResult] = await Promise.allSettled([
          getCurrentUser(),
          getCurrentUserNotificationPreferences(),
        ]);

        if (profileResult.status === "fulfilled" && profileResult.value.user) {
          setFirstName(profileResult.value.user.firstName);
          setLastName(profileResult.value.user.lastName);
          setEmail(profileResult.value.user.email);
          setBio(profileResult.value.user.bio);
          setAvatarUrl(profileResult.value.user.avatarUrl);
          setCurrency(
            profileResult.value.user.defaultCurrency === "VND" ? "VND" : "USD",
          );
          setStoredUser(profileResult.value.user);
        } else if (profileResult.status === "rejected") {
          setErrorMessage(
            profileResult.reason instanceof Error
              ? profileResult.reason.message
              : "Unable to load your profile.",
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
              : "Unable to load your notification preferences.",
          );
        }
      } finally {
        setIsLoadingProfile(false);
        setIsLoadingNotifications(false);
      }
    }

    void loadProfile();
  }, []);

  const handleSave = async () => {
    setErrorMessage("");

    if (!firstName.trim()) {
      setErrorMessage("First name cannot be empty.");
      return;
    }

    if (!lastName.trim()) {
      setErrorMessage("Last name cannot be empty.");
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
        error instanceof Error ? error.message : "Unable to save your profile.",
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSignOut = () => {
    clearStoredUser();
    navigate("/login");
  };

  const handlePasswordChange = async () => {
    setPasswordErrorMessage("");
    setPasswordSuccessMessage("");

    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      setPasswordErrorMessage("Current password and new password are required.");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordErrorMessage("Password must be at least 6 characters.");
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmNewPassword) {
      setPasswordErrorMessage("Passwords do not match.");
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
        error instanceof Error ? error.message : "Unable to update password.",
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
          : "Unable to save notification preferences.",
      );
    } finally {
      setIsSavingNotifications(false);
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

  return (
    <div className="lg:pl-60 min-h-screen bg-[#F6FBF8]">
      <div className="max-w-5xl mx-auto px-6 py-8 pt-16 lg:pt-8">
        <div className="mb-8">
          <h1
            className="text-[#111827]"
            style={{ fontSize: "1.5rem", fontWeight: 800 }}
          >
            {t.settingsTitle}
          </h1>
          <p className="text-[#6B7280] text-sm mt-0.5">{t.settingsDesc}</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl border border-[#E5E7EB] p-2">
              {tabs.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm transition-all mb-0.5 last:mb-0 ${activeTab === id ? "bg-[#F0FAF5] text-[#16A34A]" : "text-[#6B7280] hover:bg-[#F9FAFB] hover:text-[#111827]"}`}
                  style={{ fontWeight: activeTab === id ? 600 : 500 }}
                >
                  <Icon
                    className={`w-4 h-4 flex-shrink-0 ${activeTab === id ? "text-[#16A34A]" : "text-[#9CA3AF]"}`}
                  />
                  {label}
                  {activeTab === id && (
                    <ChevronRight className="w-3.5 h-3.5 ml-auto" />
                  )}
                </button>
              ))}
              <div className="border-t border-[#E5E7EB] mt-2 pt-2">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-[#EF4444] hover:bg-[#FEF2F2] transition-colors"
                  style={{ fontWeight: 500 }}
                >
                  <LogOut className="w-4 h-4" />
                  {t.signOut}
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-3">
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
                        alt="User avatar"
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
                    <div className="absolute -bottom-1 -right-1 w-7 h-7 bg-[#16A34A] rounded-xl flex items-center justify-center shadow-sm">
                      <Camera className="w-3.5 h-3.5 text-white" />
                    </div>
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
                    {avatarUrl.trim() && (
                      <button
                        onClick={() => setAvatarUrl("")}
                        className="text-xs text-[#EF4444] mt-1.5 hover:underline flex items-center gap-1"
                        style={{ fontWeight: 500 }}
                      >
                        <Trash2 className="w-3 h-3" />
                        {t.removePhoto}
                      </button>
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
                    Loading your profile...
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
                    Avatar URL
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/avatar.png"
                    value={avatarUrl}
                    onChange={(event) => setAvatarUrl(event.target.value)}
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
                    "Saving..."
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
                    Loading your notification preferences...
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
                  {isSavingNotifications ? "Saving..." : t.saveChanges}
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
                      {isSavingPassword ? "Saving..." : t.updatePassword}
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
                    className="flex items-center gap-2 bg-white text-[#EF4444] border border-[#FCA5A5] px-4 py-2.5 rounded-xl text-sm hover:bg-[#FEF2F2] transition-colors"
                    style={{ fontWeight: 600 }}
                  >
                    <Trash2 className="w-4 h-4" />
                    {t.deleteAccount}
                  </button>
                </div>
              </div>
            )}

            {activeTab === "billing" && (
              <div className="space-y-5">
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
                  <div className="flex items-start justify-between mb-5">
                    <div>
                      <h2
                        className="text-[#111827]"
                        style={{ fontWeight: 700, fontSize: "1rem" }}
                      >
                        {t.currentPlan}
                      </h2>
                      <p className="text-[#6B7280] text-sm mt-0.5">
                        {t.onFreePlan}
                      </p>
                    </div>
                    <span
                      className="bg-[#F3F4F6] text-[#6B7280] text-xs px-3 py-1.5 rounded-full"
                      style={{ fontWeight: 600 }}
                    >
                      {t.free}
                    </span>
                  </div>
                  <div className="bg-[#F6FBF8] rounded-xl p-4 border border-[#E5E7EB] mb-5">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {[
                        { label: t.groupsUsed, used: `0 / 3 ${t.groupsUsed}` },
                        { label: t.expensesUsed, used: "0 / 10" },
                        { label: t.membersLabel, used: t.unlimited },
                        { label: t.receiptScan, used: t.notIncluded },
                      ].map(({ label, used }) => (
                        <div key={label}>
                          <p className="text-[#9CA3AF] text-xs">{label}</p>
                          <p
                            className="text-[#111827] mt-0.5"
                            style={{ fontWeight: 600 }}
                          >
                            {used}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    className="bg-[#16A34A] text-white px-6 py-2.5 rounded-xl text-sm hover:bg-[#15803d] transition-colors shadow-sm"
                    style={{ fontWeight: 600 }}
                  >
                    {t.upgradePro}
                  </button>
                </div>
                <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6">
                  <h2
                    className="text-[#111827] mb-4"
                    style={{ fontWeight: 700, fontSize: "1rem" }}
                  >
                    {t.paymentMethod}
                  </h2>
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <div className="w-12 h-12 bg-[#F0FAF5] rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <CreditCard className="w-6 h-6 text-[#7EDDBA]" />
                    </div>
                    <p
                      className="text-[#374151] text-sm mb-1"
                      style={{ fontWeight: 600 }}
                    >
                      {t.noPaymentMethod}
                    </p>
                    <p className="text-[#9CA3AF] text-xs mb-4">
                      {t.noPaymentDesc}
                    </p>
                    <button
                      className="text-sm text-[#16A34A] hover:underline"
                      style={{ fontWeight: 600 }}
                    >
                      {t.addPaymentMethod}
                    </button>
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
