import { getJson, patchJson } from "../../../shared/api/client";
import type {
  ChangeCurrentUserPasswordPayload,
  CurrentUserResponse,
  UpdateCurrentUserPayload,
} from "../models/users.types";

export function getCurrentUser() {
  return getJson<CurrentUserResponse>("/api/users/me");
}

export function updateCurrentUser(payload: UpdateCurrentUserPayload) {
  return patchJson<UpdateCurrentUserPayload, CurrentUserResponse>(
    "/api/users/me",
    payload,
  );
}

export function changeCurrentUserPassword(
  payload: ChangeCurrentUserPasswordPayload,
) {
  return patchJson<
    ChangeCurrentUserPasswordPayload,
    { ok: boolean; message: string }
  >("/api/users/me/password", payload);
}
