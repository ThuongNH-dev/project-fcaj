import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { LanguageProvider } from "../../../shared/providers/LanguageProvider";
import { Sidebar } from "./Sidebar";

const mockNavigate = vi.fn();

vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>("react-router");
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock("../../../domains/auth", () => ({
  clearStoredUser: vi.fn(),
  getUserInitials: () => "TU",
  useStoredUser: () => ({
    id: "user-1",
    firstName: "Test",
    lastName: "User",
    email: "test@example.com",
    role: "user",
  }),
}));

describe("Sidebar", () => {
  it("navigates to settlements for a standard user", () => {
    render(
      <MemoryRouter>
        <LanguageProvider>
          <Sidebar currentPath="/dashboard" />
        </LanguageProvider>
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole("button", { name: "Settlements" }));
    expect(mockNavigate).toHaveBeenCalledWith("/settlement");
  });
});
