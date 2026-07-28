import type { AuthUser } from "../models/auth.types";

const AUTH_STORAGE_KEY = "splitly_user";
const AUTH_TOKEN_STORAGE_KEY = "splitly_token";
const AUTH_STORAGE_EVENT = "splitly-auth-storage-change";
const BAN_NOTICE_KEY = "splitly_ban_notice";

export interface StoredAuthSession {
  token: string;
  user: AuthUser;
}

export interface BanNotice {
  reason: string;
  at: string;
}

function notifyAuthStorageChanged() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(AUTH_STORAGE_EVENT));
}

function clearStoredAuthSessionSilently() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
}

function clearBanNoticeSilently() {
  localStorage.removeItem(BAN_NOTICE_KEY);
}

export function getStoredAuthSession(): StoredAuthSession | null {
  const rawUser = localStorage.getItem(AUTH_STORAGE_KEY);
  const rawToken = localStorage.getItem(AUTH_TOKEN_STORAGE_KEY)?.trim() ?? "";

  if (!rawUser && !rawToken) {
    return null;
  }

  if (!rawUser || !rawToken) {
    clearStoredAuthSessionSilently();
    return null;
  }

  try {
    return {
      token: rawToken,
      user: JSON.parse(rawUser) as AuthUser,
    };
  } catch {
    clearStoredAuthSessionSilently();
    return null;
  }
}

export function getStoredUser(): AuthUser | null {
  return getStoredAuthSession()?.user ?? null;
}

export function setStoredUser(user: AuthUser) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  notifyAuthStorageChanged();
}

export function getStoredToken() {
  return getStoredAuthSession()?.token ?? null;
}

export function hasStoredAuthSession() {
  return getStoredAuthSession() !== null;
}

export function setStoredAuthSession(user: AuthUser, token: string) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  notifyAuthStorageChanged();
}

export function setStoredToken(token: string) {
  localStorage.setItem(AUTH_TOKEN_STORAGE_KEY, token);
  notifyAuthStorageChanged();
}

export function clearStoredUser() {
  localStorage.removeItem(AUTH_STORAGE_KEY);
  localStorage.removeItem(AUTH_TOKEN_STORAGE_KEY);
  clearBanNoticeSilently();
  notifyAuthStorageChanged();
}

export function setStoredBanNotice(reason: string) {
  const notice: BanNotice = {
    reason: reason.trim() || "Your account has been banned.",
    at: new Date().toISOString(),
  };

  localStorage.setItem(BAN_NOTICE_KEY, JSON.stringify(notice));
  notifyAuthStorageChanged();
}

export function getStoredBanNotice(): BanNotice | null {
  const rawNotice = localStorage.getItem(BAN_NOTICE_KEY);

  if (!rawNotice) {
    return null;
  }

  try {
    return JSON.parse(rawNotice) as BanNotice;
  } catch {
    clearBanNoticeSilently();
    return null;
  }
}

export function clearStoredBanNotice() {
  clearBanNoticeSilently();
  notifyAuthStorageChanged();
}

export function getUserInitials(user: Pick<AuthUser, "firstName" | "lastName">) {
  return `${user.firstName.charAt(0)}${user.lastName.charAt(0)}`.toUpperCase();
}

export function subscribeToStoredUser(callback: () => void) {
  if (typeof window === "undefined") {
    return () => undefined;
  }

  window.addEventListener("storage", callback);
  window.addEventListener(AUTH_STORAGE_EVENT, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(AUTH_STORAGE_EVENT, callback);
  };
}
