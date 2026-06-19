import { Navigate, Outlet, Route, Routes, useLocation } from "react-router";
import { LanguageProvider } from "./context/LanguageContext";
import { Navbar } from "./components/Navbar";
import { Sidebar } from "./components/Sidebar";
import { LandingPage } from "./components/LandingPage";
import { LoginPage } from "./components/LoginPage";
import { ForgotPasswordPage } from "./components/ForgotPasswordPage";
import { ResetPasswordPage } from "./components/ResetPasswordPage";
import { Dashboard } from "./components/Dashboard";
import { GroupsPage } from "./components/GroupsPage";
import { GroupDetailPage } from "./components/GroupDetailPage";
import { SettlementPage } from "./components/SettlementPage";
import { AdminPage } from "./components/AdminPage";
import { ExpensesPage } from "./components/ExpensesPage";
import { ReceiptsPage } from "./components/ReceiptsPage";
import { SettingsPage } from "./components/SettingsPage";
import { FeedbackProvider } from "./components/ui/FeedbackProvider";
import { getStoredUser } from "./api/auth";

export default function App() {
  return (
    <LanguageProvider>
      <FeedbackProvider>
        <Routes>
          <Route path="/" element={<PublicLayout />}>
            <Route index element={<LandingPage section="landing" />} />
            <Route path="features" element={<LandingPage section="features" />} />
            <Route path="pricing" element={<LandingPage section="pricing" />} />
            <Route path="about" element={<LandingPage section="about" />} />
            <Route path="login" element={<LoginPage initialMode="login" />} />
            <Route path="register" element={<LoginPage initialMode="register" />} />
            <Route path="forgot-password" element={<ForgotPasswordPage />} />
            <Route path="reset-password" element={<ResetPasswordPage />} />
          </Route>

          <Route element={<PrivateLayout />}>
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/groups" element={<GroupsPage />} />
            <Route path="/groups/:groupId" element={<GroupDetailPage />} />
            <Route path="/expenses" element={<ExpensesPage />} />
            <Route path="/settlement" element={<SettlementPage />} />
            <Route path="/receipts" element={<ReceiptsPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/profile" element={<Navigate to="/settings" replace />} />
          </Route>

          <Route
            path="*"
            element={
              <Navigate
                to={getStoredUser() ? "/dashboard" : "/login"}
                replace
              />
            }
          />
        </Routes>
      </FeedbackProvider>
    </LanguageProvider>
  );
}

function PublicLayout() {
  const location = useLocation();

  return (
    <div className="min-h-screen bg-[#F6FBF8]">
      <Navbar currentPath={location.pathname} />
      <Outlet />
    </div>
  );
}

function PrivateLayout() {
  const location = useLocation();

  if (!getStoredUser()) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return (
    <div className="min-h-screen bg-[#F6FBF8]">
      <Sidebar currentPath={location.pathname} />
      <Outlet />
    </div>
  );
}
