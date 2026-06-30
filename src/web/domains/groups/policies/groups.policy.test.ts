import { describe, expect, it } from "vitest";
import type { AuthUser } from "../../auth";
import type { Group, GroupMember } from "../models/groups.types";
import {
  canManageGroup,
  canManageGroupMembers,
  canRemoveGroupMember,
  isGroupOwner,
} from "./groups.policy";

const ownerUser: AuthUser = {
  id: "user-owner",
  firstName: "Owner",
  lastName: "User",
  email: "owner@example.com",
  bio: "",
  avatarUrl: "",
  defaultCurrency: "USD",
  role: "user",
  createdAt: "2026-06-27T00:00:00.000Z",
  updatedAt: "2026-06-27T00:00:00.000Z",
};

const memberUser: AuthUser = {
  ...ownerUser,
  id: "user-member",
  email: "member@example.com",
};

const ownerMember: GroupMember = {
  id: "user-owner",
  name: "Owner User",
  email: "owner@example.com",
  role: "owner",
};

const regularMember: GroupMember = {
  id: "user-member",
  name: "Member User",
  email: "member@example.com",
  role: "member",
};

const group: Group = {
  id: "group-1",
  name: "Trip Fund",
  icon: "wallet",
  color: "#16A34A",
  createdBy: ownerUser.id,
  members: [ownerMember, regularMember],
  createdAt: "2026-06-27T00:00:00.000Z",
  updatedAt: "2026-06-27T00:00:00.000Z",
};

describe("groups.policy", () => {
  it("recognizes the group creator as owner", () => {
    expect(isGroupOwner(ownerUser, group)).toBe(true);
    expect(isGroupOwner(memberUser, group)).toBe(false);
  });

  it("allows only the owner to manage the group and members", () => {
    expect(canManageGroup(ownerUser, group)).toBe(true);
    expect(canManageGroupMembers(ownerUser, group)).toBe(true);

    expect(canManageGroup(memberUser, group)).toBe(false);
    expect(canManageGroupMembers(memberUser, group)).toBe(false);
    expect(canManageGroup(null, group)).toBe(false);
  });

  it("prevents removing the owner even for authorized managers", () => {
    expect(canRemoveGroupMember(ownerUser, group, regularMember)).toBe(true);
    expect(canRemoveGroupMember(ownerUser, group, ownerMember)).toBe(false);
    expect(canRemoveGroupMember(memberUser, group, regularMember)).toBe(false);
  });
});
