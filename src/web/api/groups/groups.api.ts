import { deleteJson, getJson, patchJson, postJson } from "../client";
import type {
  CreateGroupPayload,
  CreateGroupResponse,
  DeleteGroupResponse,
  GroupResponse,
  GroupsResponse,
  UpdateGroupPayload,
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

export function updateGroup(groupId: string, payload: UpdateGroupPayload) {
  return patchJson<UpdateGroupPayload, GroupResponse>(`/api/groups/${groupId}`, payload);
}

export function deleteGroup(groupId: string) {
  return deleteJson<DeleteGroupResponse>(`/api/groups/${groupId}`);
}
