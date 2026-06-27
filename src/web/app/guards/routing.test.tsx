import { act, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { describe, expect, it } from "vitest";
import { LanguageProvider } from "../../shared/providers/LanguageProvider";
import {
  clearStoredUser,
  setStoredAuthSession,
  setStoredUser,
} from "../../domains/auth";
import { AdminRoute } from "../admin/guards/AdminRoute";
import { PrivateLayout } from "../private/layout/PrivateLayout";

function renderAdminRoute(initialPath = "/admin") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <Routes>
        <Route path="/login" element={<div>login page</div>} />
        <Route path="/dashboard" element={<div>dashboard page</div>} />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <div>admin page</div>
            </AdminRoute>
          }
        />
      </Routes>
    </MemoryRouter>,
  );
}

function renderPrivateRoute(initialPath = "/dashboard") {
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <LanguageProvider>
        <Routes>
          <Route path="/login" element={<div>login page</div>} />
          <Route element={<PrivateLayout />}>
            <Route path="/dashboard" element={<div>private dashboard</div>} />
          </Route>
        </Routes>
      </LanguageProvider>
    </MemoryRouter>,
  );
}

describe("route guards", () => {
  it("redirects unauthenticated admin access to login", async () => {
    renderAdminRoute();

    expect(await screen.findByText("login page")).toBeInTheDocument();
  });

  it("redirects non-admin users away from admin pages", async () => {
    setStoredAuthSession({
      id: "user-1",
      firstName: "Codex",
      lastName: "User",
      email: "user@example.com",
      bio: "",
      avatarUrl: "",
      defaultCurrency: "USD",
      role: "user",
      createdAt: "2026-06-26T00:00:00.000Z",
      updatedAt: "2026-06-26T00:00:00.000Z",
    }, "token-user");

    renderAdminRoute();

    expect(await screen.findByText("dashboard page")).toBeInTheDocument();
  });

  it("renders admin content for admin users", async () => {
    setStoredAuthSession({
      id: "admin-1",
      firstName: "Codex",
      lastName: "Admin",
      email: "admin@example.com",
      bio: "",
      avatarUrl: "",
      defaultCurrency: "USD",
      role: "admin",
      createdAt: "2026-06-26T00:00:00.000Z",
      updatedAt: "2026-06-26T00:00:00.000Z",
    }, "token-admin");

    renderAdminRoute();

    expect(await screen.findByText("admin page")).toBeInTheDocument();
  });

  it("reacts to sign-out while viewing a private route", async () => {
    setStoredAuthSession({
      id: "user-2",
      firstName: "Codex",
      lastName: "Member",
      email: "member@example.com",
      bio: "",
      avatarUrl: "",
      defaultCurrency: "USD",
      role: "user",
      createdAt: "2026-06-26T00:00:00.000Z",
      updatedAt: "2026-06-26T00:00:00.000Z",
    }, "token-member");

    renderPrivateRoute();

    expect(await screen.findByText("private dashboard")).toBeInTheDocument();

    act(() => {
      clearStoredUser();
    });

    expect(await screen.findByText("login page")).toBeInTheDocument();
  });

  it("treats user-only localStorage as logged out for private routes", async () => {
    setStoredUser({
      id: "user-3",
      firstName: "Codex",
      lastName: "Broken",
      email: "broken@example.com",
      bio: "",
      avatarUrl: "",
      defaultCurrency: "USD",
      role: "user",
      createdAt: "2026-06-26T00:00:00.000Z",
      updatedAt: "2026-06-26T00:00:00.000Z",
    });

    renderPrivateRoute();

    expect(await screen.findByText("login page")).toBeInTheDocument();
  });
});
