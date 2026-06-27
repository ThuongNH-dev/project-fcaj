import { Navigate, Outlet, useLocation } from "react-router";
import { useStoredUser } from "../../../domains/auth";
import { Sidebar } from "./Sidebar";

export function PrivateLayout() {
  const location = useLocation();
  const user = useStoredUser();

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return (
    <div className="min-h-screen bg-[#F6FBF8]">
      <Sidebar currentPath={location.pathname} />
      <Outlet />
    </div>
  );
}
