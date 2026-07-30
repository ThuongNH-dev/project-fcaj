import { LogOut } from "lucide-react";
import { Navigate, Outlet, useLocation, useNavigate } from "react-router";
import {
  clearStoredUser,
  getStoredBanNotice,
  useStoredUser,
} from "../../../domains/auth";
import { Sidebar } from "./Sidebar";

export function PrivateLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const user = useStoredUser();
  const banNotice = getStoredBanNotice();

  const isBanned = Boolean(user?.isBanned || banNotice);

  function handleLogout() {
    clearStoredUser();
    navigate("/login");
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return (
    <div className="min-h-screen bg-[#F6FBF8] lg:flex">
      <Sidebar currentPath={location.pathname} />
      <main className="min-w-0 flex-1">
        {isBanned ? (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div className="w-full max-w-lg rounded-3xl border border-[#FECACA] bg-white p-6 shadow-2xl">
              <div className="rounded-2xl bg-[#FEF2F2] px-4 py-3 text-center">
                <p className="text-lg text-[#991B1B]" style={{ fontWeight: 800 }}>
                  Your account has been banned
                </p>
                <p className="mt-2 text-sm text-[#7F1D1D]">
                  {banNotice?.reason || user.bannedReason || "You can no longer use this account."}
                </p>
              </div>
              <p className="mt-4 text-sm text-[#6B7280]">
                Please log out and create a new account if you need to continue using the app.
              </p>
              <button
                type="button"
                onClick={handleLogout}
                className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#111827] px-4 py-3 text-sm text-white transition-colors hover:bg-[#1F2937]"
                style={{ fontWeight: 700 }}
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        ) : null}
        <Outlet />
      </main>
    </div>
  );
}
