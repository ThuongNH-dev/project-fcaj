import { Navigate, Route } from "react-router";
import { ExpensesPage } from "../../../domains/expenses/pages/ExpensesPage";
import { GroupDetailPage } from "../../../domains/groups/pages/GroupDetailPage";
import { GroupsPage } from "../../../domains/groups/pages/GroupsPage";
import { ReceiptsPage } from "../../../domains/receipts/pages/ReceiptsPage";
import { SettingsPage } from "../../../domains/users/pages/SettingsPage";
import { SettlementPage } from "../../../domains/settlements/pages/SettlementPage";
import { AdminRoutes } from "../../admin/routes/AdminRoutes";
import { PrivateLayout } from "../layout/PrivateLayout";
import { DashboardPage } from "../pages/DashboardPage";

export function PrivateRoutes() {
  return (
    <Route element={<PrivateLayout />}>
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/groups" element={<GroupsPage />} />
      <Route path="/groups/:groupId" element={<GroupDetailPage />} />
      <Route path="/expenses" element={<ExpensesPage />} />
      <Route path="/settlement" element={<SettlementPage />} />
      <Route path="/receipts" element={<ReceiptsPage />} />
      <Route path="/settings" element={<SettingsPage />} />
      <Route path="/profile" element={<Navigate to="/settings" replace />} />
      <AdminRoutes />
    </Route>
  );
}
