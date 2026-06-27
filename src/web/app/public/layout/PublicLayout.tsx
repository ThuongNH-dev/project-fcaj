import { Outlet, useLocation } from "react-router";
import { Navbar } from "./Navbar";

export function PublicLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#F6FBF8]">
      <Navbar currentPath={location.pathname} />
      <Outlet />
    </div>
  );
}
