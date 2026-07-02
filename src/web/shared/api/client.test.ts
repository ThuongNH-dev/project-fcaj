import { beforeEach, describe, expect, it, vi } from "vitest";
import { setStoredAuthSession, setStoredUser } from "../../domains/auth";
import { downloadFile, getJson } from "./client";

const mockFetch = vi.fn();

describe("shared api client", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
    mockFetch.mockReset();
  });

  it("clears the local session when the backend reports an invalid auth token", async () => {
    setStoredAuthSession(
      {
        id: "user-1",
        firstName: "Codex",
        lastName: "Tester",
        email: "codex@example.com",
        bio: "",
        avatarUrl: "",
        defaultCurrency: "USD",
        role: "user",
        createdAt: "2026-06-26T00:00:00.000Z",
        updatedAt: "2026-06-26T00:00:00.000Z",
      },
      "expired-token",
    );

    mockFetch.mockResolvedValue({
      json: async () => ({
        message: "Invalid or expired authorization token.",
      }),
      ok: false,
      status: 401,
    });

    await expect(getJson("/api/users/me")).rejects.toThrow(
      "Invalid or expired authorization token.",
    );

    expect(localStorage.getItem("splitly_user")).toBeNull();
    expect(localStorage.getItem("splitly_token")).toBeNull();
  });

  it("keeps the session for non-auth 401 responses", async () => {
    setStoredAuthSession(
      {
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
      },
      "valid-token",
    );

    mockFetch.mockResolvedValue({
      json: async () => ({
        message: "Current password is incorrect.",
      }),
      ok: false,
      status: 401,
    });

    await expect(getJson("/api/users/me/password")).rejects.toThrow(
      "Current password is incorrect.",
    );

    expect(localStorage.getItem("splitly_user")).not.toBeNull();
    expect(localStorage.getItem("splitly_token")).toBe("valid-token");
  });

  it("clears the local session when the authenticated user no longer exists", async () => {
    setStoredAuthSession(
      {
        id: "user-404",
        firstName: "Codex",
        lastName: "Deleted",
        email: "deleted@example.com",
        bio: "",
        avatarUrl: "",
        defaultCurrency: "USD",
        role: "user",
        createdAt: "2026-06-26T00:00:00.000Z",
        updatedAt: "2026-06-26T00:00:00.000Z",
      },
      "valid-but-stale-token",
    );

    mockFetch.mockResolvedValue({
      json: async () => ({
        message: "User not found.",
      }),
      ok: false,
      status: 404,
    });

    await expect(getJson("/api/users/me")).rejects.toThrow("User not found.");

    expect(localStorage.getItem("splitly_user")).toBeNull();
    expect(localStorage.getItem("splitly_token")).toBeNull();
  });

  it("sends the bearer token only when a complete auth session exists", async () => {
    setStoredUser({
      id: "user-3",
      firstName: "Codex",
      lastName: "Half",
      email: "half@example.com",
      bio: "",
      avatarUrl: "",
      defaultCurrency: "USD",
      role: "user",
      createdAt: "2026-06-26T00:00:00.000Z",
      updatedAt: "2026-06-26T00:00:00.000Z",
    });

    mockFetch.mockResolvedValue({
      json: async () => ({
        ok: true,
      }),
      ok: true,
      status: 200,
    });

    await getJson("/api/test");

    const [, requestOptions] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(requestOptions.headers);

    expect(headers.get("Authorization")).toBeNull();
    expect(localStorage.getItem("splitly_user")).toBeNull();
  });

  it("downloads files with the current auth token and requested filename", async () => {
    setStoredAuthSession(
      {
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
      },
      "token-admin",
    );

    const createObjectUrl = vi.fn(() => "blob:admin-users-export");
    const revokeObjectUrl = vi.fn();
    const clickSpy = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
    const originalCreateElement = document.createElement.bind(document);
    let createdLink: HTMLAnchorElement | null = null;

    Object.defineProperty(URL, "createObjectURL", {
      configurable: true,
      writable: true,
      value: createObjectUrl,
    });
    Object.defineProperty(URL, "revokeObjectURL", {
      configurable: true,
      writable: true,
      value: revokeObjectUrl,
    });

    const createElementSpy = vi.spyOn(document, "createElement").mockImplementation(
      ((tagName: string, options?: ElementCreationOptions) => {
        const element = originalCreateElement(tagName, options);

        if (tagName === "a") {
          createdLink = element as HTMLAnchorElement;
        }

        return element;
      }) as typeof document.createElement,
    );

    mockFetch.mockResolvedValue({
      blob: async () => new Blob(["id,email\n1,admin@example.com"], { type: "text/csv" }),
      headers: new Headers({
        "Content-Disposition": 'attachment; filename="admin-users.csv"',
      }),
      ok: true,
      status: 200,
    });

    await downloadFile("/api/admin/users/export");

    const [, requestOptions] = mockFetch.mock.calls[0] as [string, RequestInit];
    const headers = new Headers(requestOptions.headers);

    expect(headers.get("Authorization")).toBe("Bearer token-admin");
    expect(createdLink).not.toBeNull();
    expect(createdLink?.download).toBe("admin-users.csv");
    expect(createdLink?.href).toBe("blob:admin-users-export");
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(createObjectUrl).toHaveBeenCalledTimes(1);
    expect(revokeObjectUrl).toHaveBeenCalledWith("blob:admin-users-export");

    createElementSpy.mockRestore();
    clickSpy.mockRestore();
  });
});
