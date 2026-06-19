import type { AuthUser } from "../auth";

export interface AdminSessionResponse {
  ok: boolean;
  message: string;
  user?: AuthUser;
}
