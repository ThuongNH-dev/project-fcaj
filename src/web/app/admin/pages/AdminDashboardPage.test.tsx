import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "../../../shared/providers/LanguageProvider";
import { AdminDashboardPage } from "./AdminDashboardPage";

const {
  mockDeleteAdminUser,
  mockGetAdminUser,
  mockGetAdminUsers,
  mockShowToast,
  mockConfirm,
  mockRefreshDashboard,
  mockUpdateAdminUserRole,
  mockUseStoredUser,
} = vi.hoisted(() => ({
  mockDeleteAdminUser: vi.fn(),
  mockGetAdminUser: vi.fn(),
  mockGetAdminUsers: vi.fn(),
  mockShowToast: vi.fn(),
  mockConfirm: vi.fn(),
  mockRefreshDashboard: vi.fn(),
  mockUpdateAdminUserRole: vi.fn(),
  mockUseStoredUser: vi.fn(),
}));

vi.mock("../../../domains/admin-reporting", () => ({
  deleteAdminUser: mockDeleteAdminUser,
  getAdminUser: mockGetAdminUser,
  getAdminUsers: mockGetAdminUsers,
  updateAdminUserRole: mockUpdateAdminUserRole,
}));

vi.mock("../../../domains/auth", () => ({
  useStoredUser: mockUseStoredUser,
}));

vi.mock("../../../shared/providers/FeedbackProvider", () => ({
  useFeedback: () => ({
    confirm: mockConfirm,
    showToast: mockShowToast,
  }),
}));

vi.mock("../layout/AdminLayout", () => ({
  useAdminLayoutContext: () => ({
    refreshDashboard: mockRefreshDashboard,
  }),
}));

function createUserRecord(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    id: "user-1",
    firstName: "Alex",
    lastName: "Nguyen",
    fullName: "Alex Nguyen",
    email: "alex@example.com",
    bio: "",
    avatarUrl: "",
    defaultCurrency: "USD",
    role: "user",
    groupCount: 2,
    ownedGroupCount: 1,
    expenseCount: 4,
    receiptUploadCount: 3,
    pendingSettlementCount: 2,
    settledExpenseCount: 2,
    totalPaidAmount: 148.5,
    createdAt: "2026-06-27T00:00:00.000Z",
    updatedAt: "2026-06-27T00:00:00.000Z",
    ...overrides,
  };
}

function createUserDetail(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    ...createUserRecord(),
    groups: [
      {
        id: "group-1",
        name: "Summer Trip",
        role: "owner",
        updatedAt: "2026-06-27T00:00:00.000Z",
      },
    ],
    ...overrides,
  };
}

function renderPage() {
  return render(
    <LanguageProvider>
      <AdminDashboardPage />
    </LanguageProvider>,
  );
}

describe("AdminDashboardPage", () => {
  beforeEach(() => {
    mockDeleteAdminUser.mockReset();
    mockGetAdminUser.mockReset();
    mockGetAdminUsers.mockReset();
    mockShowToast.mockReset();
    mockConfirm.mockReset();
    mockRefreshDashboard.mockReset();
    mockRefreshDashboard.mockResolvedValue(undefined);
    mockUpdateAdminUserRole.mockReset();
    mockUseStoredUser.mockReset();
    mockUseStoredUser.mockReturnValue({
      id: "admin-1",
      firstName: "Admin",
      lastName: "User",
      email: "admin@example.com",
      bio: "",
      avatarUrl: "",
      defaultCurrency: "USD",
      role: "admin",
      createdAt: "2026-06-27T00:00:00.000Z",
      updatedAt: "2026-06-27T00:00:00.000Z",
    });
  });

  it("loads admin users and shows the selected user detail", async () => {
    mockGetAdminUsers.mockResolvedValue({
      ok: true,
      message: "Admin users fetched successfully.",
      users: [createUserRecord()],
    });
    mockGetAdminUser.mockResolvedValue({
      ok: true,
      message: "Admin user fetched successfully.",
      user: createUserDetail(),
    });

    renderPage();

    expect(await screen.findByText("User Management")).toBeInTheDocument();
    expect(screen.getByText("alex@example.com")).toBeInTheDocument();
    expect(await screen.findByText("Role Management")).toBeInTheDocument();
    expect(screen.getByText("Group Memberships")).toBeInTheDocument();
    expect(screen.getByText("Summer Trip")).toBeInTheDocument();
  });

  it("updates a user's role and refreshes admin data", async () => {
    mockGetAdminUsers
      .mockResolvedValueOnce({
        ok: true,
        message: "Admin users fetched successfully.",
        users: [createUserRecord()],
      })
      .mockResolvedValueOnce({
        ok: true,
        message: "Admin users fetched successfully.",
        users: [createUserRecord({ role: "admin" })],
      });
    mockGetAdminUser.mockResolvedValue({
      ok: true,
      message: "Admin user fetched successfully.",
      user: createUserDetail(),
    });
    mockUpdateAdminUserRole.mockResolvedValue({
      ok: true,
      message: "User role updated successfully.",
      user: createUserRecord({ role: "admin" }),
    });

    renderPage();

    await screen.findByText("Role Management");

    fireEvent.click(screen.getByRole("button", { name: "Admin" }));
    fireEvent.click(screen.getByRole("button", { name: "Save role" }));

    await waitFor(() => {
      expect(mockUpdateAdminUserRole).toHaveBeenCalledWith("user-1", {
        role: "admin",
      });
    });

    expect(mockRefreshDashboard).toHaveBeenCalledTimes(1);
    expect(mockShowToast).toHaveBeenCalledWith({
      variant: "success",
      message: "User role updated successfully.",
    });
  });

  it("disables destructive actions for the current admin account", async () => {
    mockUseStoredUser.mockReturnValue({
      id: "user-1",
      firstName: "Alex",
      lastName: "Nguyen",
      email: "alex@example.com",
      bio: "",
      avatarUrl: "",
      defaultCurrency: "USD",
      role: "admin",
      createdAt: "2026-06-27T00:00:00.000Z",
      updatedAt: "2026-06-27T00:00:00.000Z",
    });
    mockGetAdminUsers.mockResolvedValue({
      ok: true,
      message: "Admin users fetched successfully.",
      users: [createUserRecord({ role: "admin" })],
    });
    mockGetAdminUser.mockResolvedValue({
      ok: true,
      message: "Admin user fetched successfully.",
      user: createUserDetail({ role: "admin" }),
    });

    renderPage();

    expect(await screen.findByRole("button", { name: "Delete user" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Admin" })).toBeDisabled();
    expect(screen.getByText("Your own admin role is protected from inline changes.")).toBeInTheDocument();
  });
});
