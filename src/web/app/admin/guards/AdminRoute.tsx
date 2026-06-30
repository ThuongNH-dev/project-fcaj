import { Navigate } from "react-router";
import { useStoredUser } from "../../../domains/auth";

export function AdminRoute({ children }: { children: JSX.Element }) {
  const user = useStoredUser();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (user.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
