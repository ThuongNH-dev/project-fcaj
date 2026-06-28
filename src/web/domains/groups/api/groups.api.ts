import { deleteJson, getJson, patchJson, postJson } from "../../../shared/api/client";
import type {
  AddGroupMemberPayload,
  CreateGroupPayload,
  CreateGroupResponse,
  DeleteGroupResponse,
  GroupResponse,
  GroupsResponse,
  UpdateGroupPayload,
} from "../models/groups.types";

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

export function addGroupMember(groupId: string, payload: AddGroupMemberPayload) {
  return postJson<AddGroupMemberPayload, GroupResponse>(
    `/api/groups/${groupId}/members`,
    payload,
  );
}

export function removeGroupMember(groupId: string, memberId: string) {
  return deleteJson<GroupResponse>(`/api/groups/${groupId}/members/${memberId}`);
}
