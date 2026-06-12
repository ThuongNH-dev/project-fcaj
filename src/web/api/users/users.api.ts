import { getJson, patchJson } from "../client";
import type {
  CurrentUserResponse,
  UpdateCurrentUserPayload,
} from "./users.types";

export function getCurrentUser() {
  return getJson<CurrentUserResponse>("/api/users/me");
}

export function updateCurrentUser(payload: UpdateCurrentUserPayload) {
  return patchJson<UpdateCurrentUserPayload, CurrentUserResponse>(
    "/api/users/me",
    payload,
  );
}
