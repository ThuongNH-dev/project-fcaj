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
  mockDeleteCurrentUserPaymentMethod,
  mockGetCurrentUser,
  mockGetCurrentUserBilling,
  mockGetCurrentUserNotificationPreferences,
  mockGetCurrentUserPaymentMethod,
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
  mockUpdateCurrentUserPaymentMethod,
  mockUseStoredUser,
} = vi.hoisted(() => ({
  mockChangeCurrentUserPassword: vi.fn(),
  mockClearStoredUser: vi.fn(),
  mockConfirm: vi.fn(),
  mockDeleteCurrentUser: vi.fn(),
  mockDeleteCurrentUserPaymentMethod: vi.fn(),
  mockGetCurrentUser: vi.fn(),
  mockGetCurrentUserBilling: vi.fn(),
  mockGetCurrentUserNotificationPreferences: vi.fn(),
  mockGetCurrentUserPaymentMethod: vi.fn(),
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
  mockUpdateCurrentUserPaymentMethod: vi.fn(),
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
  deleteCurrentUserPaymentMethod: mockDeleteCurrentUserPaymentMethod,
  getCurrentUser: mockGetCurrentUser,
  getCurrentUserBilling: mockGetCurrentUserBilling,
  getCurrentUserNotificationPreferences: mockGetCurrentUserNotificationPreferences,
  getCurrentUserPaymentMethod: mockGetCurrentUserPaymentMethod,
  updateCurrentUser: mockUpdateCurrentUser,
  updateCurrentUserBilling: mockUpdateCurrentUserBilling,
  updateCurrentUserNotificationPreferences:
    mockUpdateCurrentUserNotificationPreferences,
  updateCurrentUserPaymentMethod: mockUpdateCurrentUserPaymentMethod,
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
      updatedAt: "2026-07-01T00:00:00.000Z",
    },
    usage: {
      groupCount: 0,
      groupLimit: 3,
      expenseCount: 0,
      expenseLimit: 10,
      receiptScanIncluded: false,
    },
  };
}

function createPaymentMethod() {
  return {
    brand: "visa" as const,
    last4: "4242",
    expiryMonth: 12,
    expiryYear: 2030,
    cardholderName: "Admin User",
    billingEmail: "admin@example.com",
    updatedAt: "2026-07-01T00:00:00.000Z",
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

describe("SettingsPage payment method", () => {
  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.lang = "";
    globalThis.FileReader = OriginalFileReader;

    mockChangeCurrentUserPassword.mockReset();
    mockClearStoredUser.mockReset();
    mockConfirm.mockReset();
    mockDeleteCurrentUser.mockReset();
    mockDeleteCurrentUserPaymentMethod.mockReset();
    mockGetCurrentUser.mockReset();
    mockGetCurrentUserBilling.mockReset();
    mockGetCurrentUserNotificationPreferences.mockReset();
    mockGetCurrentUserPaymentMethod.mockReset();
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
    mockUpdateCurrentUserPaymentMethod.mockReset();
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
    mockGetCurrentUserPaymentMethod.mockResolvedValue({
      ok: true,
      message: "No payment method saved yet.",
      paymentMethod: null,
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

  it("shows a saved payment method on the billing tab", async () => {
    mockGetCurrentUserPaymentMethod.mockResolvedValue({
      ok: true,
      message: "Payment method fetched successfully.",
      paymentMethod: createPaymentMethod(),
    });

    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Billing" }));

    expect(await screen.findByText("Visa ending in 4242")).toBeInTheDocument();
    expect(screen.getByText("Admin User")).toBeInTheDocument();
    expect(screen.getByText("admin@example.com")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Update payment method" })).toBeInTheDocument();
  });

  it("saves a new payment method and shows the saved card summary", async () => {
    mockUpdateCurrentUserPaymentMethod.mockResolvedValue({
      ok: true,
      message: "Payment method saved successfully.",
      paymentMethod: createPaymentMethod(),
    });

    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Billing" }));
    fireEvent.click(await screen.findByRole("button", { name: "+ Add payment method" }));

    fireEvent.change(screen.getByPlaceholderText("Name on card"), {
      target: { value: "Admin User" },
    });
    fireEvent.change(screen.getByPlaceholderText("4242 4242 4242 4242"), {
      target: { value: "4242 4242 4242 4242" },
    });
    fireEvent.change(screen.getByPlaceholderText("12"), {
      target: { value: "12" },
    });
    fireEvent.change(screen.getByPlaceholderText("2030"), {
      target: { value: "2030" },
    });
    fireEvent.change(screen.getByPlaceholderText("123"), {
      target: { value: "123" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Save payment method" }));

    await waitFor(() => {
      expect(mockUpdateCurrentUserPaymentMethod).toHaveBeenCalledWith({
        billingEmail: "admin@example.com",
        cardNumber: "4242 4242 4242 4242",
        cardholderName: "Admin User",
        cvc: "123",
        expiryMonth: 12,
        expiryYear: 2030,
      });
    });

    expect(await screen.findByText("Visa ending in 4242")).toBeInTheDocument();
    expect(mockShowToast).toHaveBeenCalledWith({
      variant: "success",
      message: "Payment method saved successfully.",
    });
  });

  it("removes the saved payment method after confirmation", async () => {
    mockGetCurrentUserPaymentMethod.mockResolvedValue({
      ok: true,
      message: "Payment method fetched successfully.",
      paymentMethod: createPaymentMethod(),
    });
    mockConfirm.mockResolvedValue(true);
    mockDeleteCurrentUserPaymentMethod.mockResolvedValue({
      ok: true,
      message: "Payment method removed successfully.",
      paymentMethod: null,
    });

    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Billing" }));
    fireEvent.click(await screen.findByRole("button", { name: "Remove payment method" }));

    await waitFor(() => {
      expect(mockDeleteCurrentUserPaymentMethod).toHaveBeenCalledTimes(1);
    });

    expect(await screen.findByRole("button", { name: "Save payment method" })).toBeInTheDocument();
    expect(mockShowToast).toHaveBeenCalledWith({
      variant: "success",
      message: "Payment method removed successfully.",
    });
  });

  it("switches language from the appearance tab and persists the selection", async () => {
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Appearance" }));

    expect(await screen.findByText("Language")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Tiếng Việt" }));

    await waitFor(() => {
      expect(window.localStorage.getItem("splitly-language")).toBe("vi");
      expect(document.documentElement.lang).toBe("vi");
    });

    expect(screen.getByText("Ngôn ngữ")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "English" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Tiếng Việt" })).toBeInTheDocument();
  });

  it("shows translated password validation after switching to Vietnamese", async () => {
    renderPage();

    fireEvent.click(await screen.findByRole("button", { name: "Appearance" }));
    fireEvent.click(screen.getByRole("button", { name: "Tiếng Việt" }));
    fireEvent.click(await screen.findByRole("button", { name: "Bảo mật" }));
    fireEvent.click(screen.getByRole("button", { name: "Cập nhật mật khẩu" }));

    expect(
      await screen.findByText(
        "Mật khẩu hiện tại và mật khẩu mới là bắt buộc.",
      ),
    ).toBeInTheDocument();
  });
});
