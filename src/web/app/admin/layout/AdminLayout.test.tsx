import type { ReactNode } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "../../../shared/providers/LanguageProvider";
import { AdminLayout } from "./AdminLayout";

const {
  mockDownloadAdminUsersExport,
  mockGetAdminDashboard,
  mockShowToast,
} = vi.hoisted(() => ({
  mockDownloadAdminUsersExport: vi.fn(),
  mockGetAdminDashboard: vi.fn(),
  mockShowToast: vi.fn(),
}));

vi.mock("../guards/AdminRoute", () => ({
  AdminRoute: ({ children }: { children: ReactNode }) => <>{children}</>,
}));

vi.mock("../../../domains/admin-reporting", () => ({
  downloadAdminUsersExport: mockDownloadAdminUsersExport,
  getAdminDashboard: mockGetAdminDashboard,
}));

vi.mock("../../../shared/providers/FeedbackProvider", () => ({
  useFeedback: () => ({
    showToast: mockShowToast,
  }),
}));

function renderLayout(initialPath = "/admin/users") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LanguageProvider>
        <Routes>
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<div>admin overview</div>} />
            <Route path="users" element={<div>users tab</div>} />
            <Route path="groups" element={<div>groups tab</div>} />
          </Route>
        </Routes>
      </LanguageProvider>
    </MemoryRouter>,
  );
}

describe("AdminLayout", () => {
  beforeEach(() => {
    mockDownloadAdminUsersExport.mockReset();
    mockGetAdminDashboard.mockReset();
    mockShowToast.mockReset();
    mockGetAdminDashboard.mockResolvedValue({
      ok: true,
      message: "Admin dashboard fetched successfully.",
      stats: {
        totalUsers: 12,
        totalGroups: 5,
        totalExpenses: 18,
        totalReceiptUploads: 6,
        totalAdmins: 2,
        newUsersLast7Days: 3,
      },
    });
  });

  it("enables export on the users tab and shows a success toast", async () => {
    mockDownloadAdminUsersExport.mockResolvedValue(undefined);

    renderLayout("/admin/users");

    const exportButton = await screen.findByRole("button", {
      name: "Export Data",
    });

    expect(exportButton).toBeEnabled();

    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(mockDownloadAdminUsersExport).toHaveBeenCalledTimes(1);
    });

    expect(mockShowToast).toHaveBeenCalledWith({
      variant: "success",
      message: "User export started successfully.",
    });
  });

  it("keeps export disabled outside the users tab", async () => {
    renderLayout("/admin/groups");

    const exportButton = await screen.findByRole("button", {
      name: "Export Data",
    });

    expect(exportButton).toBeDisabled();
    expect(exportButton).toHaveAttribute(
      "title",
      "User export is available on the Users tab.",
    );

    fireEvent.click(exportButton);

    expect(mockDownloadAdminUsersExport).not.toHaveBeenCalled();
    expect(mockShowToast).not.toHaveBeenCalled();
  });
});
