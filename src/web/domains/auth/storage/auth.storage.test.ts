import { describe, expect, it, vi } from "vitest";
import type { AuthUser } from "../models/auth.types";
import {
  clearStoredUser,
  getStoredAuthSession,
  getStoredToken,
  getStoredUser,
  hasStoredAuthSession,
  setStoredAuthSession,
  setStoredUser,
  subscribeToStoredUser,
} from "./auth.storage";

const mockUser: AuthUser = {
  id: "user-1",
  firstName: "Codex",
  lastName: "Tester",
  email: "codex@example.com",
  bio: "Testing auth storage",
  avatarUrl: "",
  defaultCurrency: "USD",
  role: "user",
  createdAt: "2026-06-26T00:00:00.000Z",
  updatedAt: "2026-06-26T00:00:00.000Z",
};

describe("auth.storage", () => {
  it("stores and reads back the current user and token", () => {
    setStoredAuthSession(mockUser, "token-123");

    expect(getStoredUser()).toEqual(mockUser);
    expect(getStoredToken()).toBe("token-123");
    expect(getStoredAuthSession()).toEqual({
      token: "token-123",
      user: mockUser,
    });
    expect(hasStoredAuthSession()).toBe(true);
  });

  it("clears corrupted user JSON from localStorage", () => {
    localStorage.setItem("splitly_token", "token-123");
    localStorage.setItem("splitly_user", "{bad-json");

    expect(getStoredUser()).toBeNull();
    expect(localStorage.getItem("splitly_user")).toBeNull();
    expect(localStorage.getItem("splitly_token")).toBeNull();
  });

  it("clears partial auth state when user or token is missing", () => {
    setStoredUser(mockUser);

    expect(getStoredUser()).toBeNull();
    expect(hasStoredAuthSession()).toBe(false);
    expect(localStorage.getItem("splitly_user")).toBeNull();

    localStorage.setItem("splitly_token", "token-123");

    expect(getStoredToken()).toBeNull();
    expect(localStorage.getItem("splitly_token")).toBeNull();
  });

  it("notifies subscribers when auth storage changes", () => {
    const callback = vi.fn();
    const unsubscribe = subscribeToStoredUser(callback);

    setStoredAuthSession(mockUser, "token-123");
    clearStoredUser();

    expect(callback).toHaveBeenCalledTimes(2);

    unsubscribe();
  });
});
