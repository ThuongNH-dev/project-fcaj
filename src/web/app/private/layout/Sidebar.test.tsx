import { act, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";
import { LanguageProvider } from "../../../shared/providers/LanguageProvider";
import {
  clearStoredUser,
  setStoredAuthSession,
} from "../../../domains/auth";
import { Sidebar } from "./Sidebar";

function renderSidebar() {
  return render(
    <MemoryRouter>
      <LanguageProvider>
        <Sidebar currentPath="/dashboard" />
      </LanguageProvider>
    </MemoryRouter>,
  );
}

describe("Sidebar", () => {
  it("updates the displayed user immediately after session changes", async () => {
    setStoredAuthSession({
      id: "user-1",
      firstName: "Codex",
      lastName: "Before",
      email: "before@example.com",
      bio: "",
      avatarUrl: "",
      defaultCurrency: "USD",
      role: "user",
      createdAt: "2026-06-26T00:00:00.000Z",
      updatedAt: "2026-06-26T00:00:00.000Z",
    }, "token-before");

    renderSidebar();

    expect(screen.getByText("Codex Before")).toBeInTheDocument();
    expect(screen.queryByText("Admin")).not.toBeInTheDocument();

    act(() => {
      setStoredAuthSession({
        id: "user-1",
        firstName: "Codex",
        lastName: "After",
        email: "after@example.com",
        bio: "",
        avatarUrl: "",
        defaultCurrency: "USD",
        role: "admin",
        createdAt: "2026-06-26T00:00:00.000Z",
        updatedAt: "2026-06-26T00:00:00.000Z",
      }, "token-after");
    });

    expect(await screen.findByText("Codex After")).toBeInTheDocument();
    expect(screen.getByText("after@example.com")).toBeInTheDocument();
    expect(screen.getByText("Admin")).toBeInTheDocument();
  });

  it("falls back to guest state after sign-out", async () => {
    setStoredAuthSession({
      id: "user-2",
      firstName: "Guest",
      lastName: "User",
      email: "guest@example.com",
      bio: "",
      avatarUrl: "",
      defaultCurrency: "USD",
      role: "user",
      createdAt: "2026-06-26T00:00:00.000Z",
      updatedAt: "2026-06-26T00:00:00.000Z",
    }, "token-guest");

    renderSidebar();

    act(() => {
      clearStoredUser();
    });

    expect(await screen.findByText("Guest")).toBeInTheDocument();
    expect(screen.getByText("No active session")).toBeInTheDocument();
  });
});
