import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "../../../shared/providers/LanguageProvider";
import { SettingsPage } from "./SettingsPage";

const OriginalFileReader = globalThis.FileReader;

const {
  mockChangeCurrentUserPassword,
  mockClearStoredUser,
  mockConfirm,
  mockDeleteCurrentUser,
  mockGetCurrentUser,
  mockGetCurrentUserBilling,
  mockGetCurrentUserNotificationPreferences,
  mockGetUserInitials,
  mockNavigate,
  mockSetAccentColor,
  mockSetDensity,
  mockSetStoredUser,
  mockSetTheme,
  mockShowToast,
  mockUpdateCurrentUser,
  mockUpdateCurrentUserBilling,
  mockUpdateCurrentUserNotificationPreferences,
  mockUseStoredUser,
} = vi.hoisted(() => ({
  mockChangeCurrentUserPassword: vi.fn(),
  mockClearStoredUser: vi.fn(),
  mockConfirm: vi.fn(),
  mockDeleteCurrentUser: vi.fn(),
  mockGetCurrentUser: vi.fn(),
  mockGetCurrentUserBilling: vi.fn(),
  mockGetCurrentUserNotificationPreferences: vi.fn(),
  mockGetUserInitials: vi.fn(),
  mockNavigate: vi.fn(),
  mockSetAccentColor: vi.fn(),
  mockSetDensity: vi.fn(),
  mockSetStoredUser: vi.fn(),
  mockSetTheme: vi.fn(),
  mockShowToast: vi.fn(),
  mockUpdateCurrentUser: vi.fn(),
  mockUpdateCurrentUserBilling: vi.fn(),
  mockUpdateCurrentUserNotificationPreferences: vi.fn(),
  mockUseStoredUser: vi.fn(),
}));

vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>("react-router");

  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock("next-themes", () => ({
  useTheme: () => ({
    setTheme: mockSetTheme,
    theme: "system",
  }),
}));

vi.mock("../../../shared/providers/AppearanceProvider", () => ({
  useAppearance: () => ({
    accentColor: "green",
    density: "default",
    setAccentColor: mockSetAccentColor,
    setDensity: mockSetDensity,
  }),
}));

vi.mock("../../../shared/providers/FeedbackProvider", () => ({
  useFeedback: () => ({
    confirm: mockConfirm,
    showToast: mockShowToast,
  }),
}));

vi.mock("../../auth", () => ({
  clearStoredUser: mockClearStoredUser,
  getUserInitials: mockGetUserInitials,
  setStoredUser: mockSetStoredUser,
  useStoredUser: mockUseStoredUser,
}));

vi.mock("..", () => ({
  changeCurrentUserPassword: mockChangeCurrentUserPassword,
  deleteCurrentUser: mockDeleteCurrentUser,
  getCurrentUser: mockGetCurrentUser,
  getCurrentUserBilling: mockGetCurrentUserBilling,
  getCurrentUserNotificationPreferences: mockGetCurrentUserNotificationPreferences,
  updateCurrentUser: mockUpdateCurrentUser,
  updateCurrentUserBilling: mockUpdateCurrentUserBilling,
  updateCurrentUserNotificationPreferences:
    mockUpdateCurrentUserNotificationPreferences,
}));

function createUser() {
  return {
    id: "admin-1",
    firstName: "Admin",
    lastName: "User",
    email: "admin@example.com",
    bio: "Admin bio",
    avatarUrl: "",
    defaultCurrency: "USD" as const,
    role: "admin" as const,
    createdAt: "2026-07-01T00:00:00.000Z",
    updatedAt: "2026-07-01T00:00:00.000Z",
  };
}

function createBillingSummary() {
  return {
    profile: {
      plan: "free" as const,
      status: "active" as const,
      autoRenew: false,
      updatedAt: "2026-07-01T00:00:00.000Z",
    },
    usage: {
      groupCount: 0,
      groupLimit: 3,
      expenseCount: 0,
      expenseLimit: 5,
      receiptScanIncluded: false,
    },
  };
}

function renderPage() {
  return render(
    <MemoryRouter>
      <LanguageProvider>
        <SettingsPage />
      </LanguageProvider>
    </MemoryRouter>,
  );
}

function mockFileReaderWithResult(result: string) {
  class MockFileReader {
    result: string | null = null;
    onload: null | (() => void) = null;
    onerror: null | (() => void) = null;

    readAsDataURL() {
      this.result = result;
      this.onload?.();
    }
  }

  globalThis.FileReader = MockFileReader as unknown as typeof FileReader;
}

describe("SettingsPage", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.lang = "";
    globalThis.FileReader = OriginalFileReader;

    mockChangeCurrentUserPassword.mockReset();
    mockClearStoredUser.mockReset();
    mockConfirm.mockReset();
    mockDeleteCurrentUser.mockReset();
    mockGetCurrentUser.mockReset();
    mockGetCurrentUserBilling.mockReset();
    mockGetCurrentUserNotificationPreferences.mockReset();
    mockGetUserInitials.mockReset();
    mockNavigate.mockReset();
    mockSetAccentColor.mockReset();
    mockSetDensity.mockReset();
    mockSetStoredUser.mockReset();
    mockSetTheme.mockReset();
    mockShowToast.mockReset();
    mockUpdateCurrentUser.mockReset();
    mockUpdateCurrentUserBilling.mockReset();
    mockUpdateCurrentUserNotificationPreferences.mockReset();
    mockUseStoredUser.mockReset();

    mockGetUserInitials.mockReturnValue("AU");
    mockUseStoredUser.mockReturnValue(createUser());
    mockGetCurrentUser.mockResolvedValue({
      ok: true,
      message: "User profile fetched successfully.",
      user: createUser(),
    });
    mockGetCurrentUserNotificationPreferences.mockResolvedValue({
      ok: true,
      message: "Notification preferences fetched successfully.",
      notificationPreferences: {
        expenseAdded: false,
        paymentReceived: false,
        settlementReminder: false,
        weeklyDigest: false,
        groupInvites: false,
        marketingEmails: false,
      },
    });
    mockGetCurrentUserBilling.mockResolvedValue({
      ok: true,
      message: "Billing summary fetched successfully.",
      billing: createBillingSummary(),
    });
    mockUpdateCurrentUser.mockResolvedValue({
      ok: true,
      message: "User profile updated successfully.",
      user: createUser(),
    });
  });

  it("uploads an avatar image and saves it with the profile", async () => {
    const avatarDataUrl = "data:image/png;base64,ZmFrZS1hdmF0YXI=";

    mockFileReaderWithResult(avatarDataUrl);
    mockUpdateCurrentUser.mockResolvedValue({
      ok: true,
      message: "User profile updated successfully.",
      user: {
        ...createUser(),
        avatarUrl: avatarDataUrl,
      },
    });

    renderPage();

    const avatarInput = await screen.findByTestId("avatar-upload-input");
    const avatarFile = new File(["avatar"], "avatar.png", {
      type: "image/png",
    });

    fireEvent.change(avatarInput, {
      target: { files: [avatarFile] },
    });

    expect(await screen.findByAltText("User avatar")).toHaveAttribute(
      "src",
      avatarDataUrl,
    );
    expect(screen.getByPlaceholderText("https://example.com/avatar.png")).toHaveValue(
      "",
    );
    expect(screen.getByText("Using the uploaded image.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

    await waitFor(() => {
      expect(mockUpdateCurrentUser).toHaveBeenCalledWith({
        firstName: "Admin",
        lastName: "User",
        bio: "Admin bio",
        avatarUrl: avatarDataUrl,
        defaultCurrency: "USD",
      });
    });

    expect(mockSetStoredUser).toHaveBeenCalledWith({
      ...createUser(),
      avatarUrl: avatarDataUrl,
    });
  });

  it("shows an error when the selected avatar file type is not supported", async () => {
    renderPage();

    const avatarInput = await screen.findByTestId("avatar-upload-input");
    const invalidAvatarFile = new File(["avatar"], "avatar.gif", {
      type: "image/gif",
    });

    fireEvent.change(avatarInput, {
      target: { files: [invalidAvatarFile] },
    });

    expect(
      await screen.findByText("Avatar must be a PNG, JPG, or WEBP image."),
    ).toBeInTheDocument();
    expect(mockUpdateCurrentUser).not.toHaveBeenCalled();
  });

  it("switches language from the appearance tab and persists the selection", async () => {
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Appearance" }));

    expect(await screen.findByText("Language")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Tiáº¿ng Viá»‡t" }));

    await waitFor(() => {
      expect(window.localStorage.getItem("splitly-language")).toBe("vi");
      expect(document.documentElement.lang).toBe("vi");
    });

    expect(screen.getByText("NgĂ´n ngá»¯")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "English" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tiáº¿ng Viá»‡t" })).toBeInTheDocument();
  });

  it("shows translated password validation after switching to Vietnamese", async () => {
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Appearance" }));
    fireEvent.click(screen.getByRole("button", { name: "Tiáº¿ng Viá»‡t" }));
    fireEvent.click(await screen.findByRole("button", { name: "Báº£o máº­t" }));
    fireEvent.click(screen.getByRole("button", { name: "Cáº­p nháº­t máº­t kháº©u" }));

    expect(
      await screen.findByText(
        "Máº­t kháº©u hiá»‡n táº¡i vĂ  máº­t kháº©u má»›i lĂ  báº¯t buá»™c.",
      ),
    ).toBeInTheDocument();
  });
});
