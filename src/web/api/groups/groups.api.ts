import { getJson, postJson } from "../client";
import type {
  CreateGroupPayload,
  CreateGroupResponse,
  GroupResponse,
  GroupsResponse,
} from "./groups.types";

export function getGroups() {
  return getJson<GroupsResponse>("/api/groups");
}

export function getGroup(groupId: string) {
  return getJson<GroupResponse>(`/api/groups/${groupId}`);
}

export function createGroup(payload: CreateGroupPayload) {
  return postJson<CreateGroupPayload, CreateGroupResponse>("/api/groups", payload);
}
