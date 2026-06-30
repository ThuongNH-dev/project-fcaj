import { useEffect, useState } from "react";
import type { AuthUser } from "../models/auth.types";
import { getStoredUser, subscribeToStoredUser } from "../storage/auth.storage";

export function useStoredUser(): AuthUser | null {
  const [user, setUser] = useState<AuthUser | null>(() => getStoredUser());

  useEffect(() => {
    return subscribeToStoredUser(() => {
      setUser(getStoredUser());
    });
  }, []);

  return user;
}
