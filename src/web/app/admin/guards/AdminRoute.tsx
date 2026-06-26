import { Navigate } from "react-router";
import { getStoredUser } from "../../../domains/auth";

export function AdminRoute({ children }: { children: JSX.Element }) {
  const user = getStoredUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
