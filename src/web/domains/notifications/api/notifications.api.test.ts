import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  deleteNotification,
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  syncNotifications,
} from "./notifications.api";

const { mockDeleteJson, mockGetJson, mockPatchJson, mockPostJson } = vi.hoisted(
  () => ({
    mockDeleteJson: vi.fn(),
    mockGetJson: vi.fn(),
    mockPatchJson: vi.fn(),
    mockPostJson: vi.fn(),
  }),
);

vi.mock("../../../shared/api/client", () => ({
  deleteJson: mockDeleteJson,
  getJson: mockGetJson,
  patchJson: mockPatchJson,
  postJson: mockPostJson,
}));

describe("notifications api", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("gets the first notification page with backend defaults", () => {
    getNotifications();

    expect(mockGetJson).toHaveBeenCalledWith(
      "/api/notifications?page=1&limit=20",
    );
  });

  it("gets a requested notification page", () => {
    getNotifications({ page: 3, limit: 50 });

    expect(mockGetJson).toHaveBeenCalledWith(
      "/api/notifications?page=3&limit=50",
    );
  });

  it("gets the unread notification count", () => {
    getUnreadNotificationCount();

    expect(mockGetJson).toHaveBeenCalledWith(
      "/api/notifications/unread-count",
    );
  });

  it("marks one notification as read using an encoded id", () => {
    markNotificationAsRead("notification/id");

    expect(mockPatchJson).toHaveBeenCalledWith(
      "/api/notifications/notification%2Fid/read",
      {},
    );
  });

  it("marks all notifications as read", () => {
    markAllNotificationsAsRead();

    expect(mockPatchJson).toHaveBeenCalledWith(
      "/api/notifications/read-all",
      {},
    );
  });

  it("deletes one notification using an encoded id", () => {
    deleteNotification("notification/id");

    expect(mockDeleteJson).toHaveBeenCalledWith(
      "/api/notifications/notification%2Fid",
    );
  });

  it("syncs settlement reminder notifications", () => {
    syncNotifications();

    expect(mockPostJson).toHaveBeenCalledWith(
      "/api/notifications/sync",
      {},
    );
  });
});
