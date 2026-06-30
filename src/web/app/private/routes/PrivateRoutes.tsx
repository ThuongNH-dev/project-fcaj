import { Navigate, type RouteObject } from "react-router";
import { ExpensesPage } from "../../../domains/expenses/pages/ExpensesPage";
import { GroupDetailPage } from "../../../domains/groups/pages/GroupDetailPage";
import { MyGroupsPage } from "../../../domains/groups/pages/MyGroupsPage";
import { ReceiptsPage } from "../../../domains/receipts/pages/ReceiptsPage";
import { SettingsPage } from "../../../domains/users/pages/SettingsPage";
import { SettlementPage } from "../../../domains/settlements/pages/SettlementPage";
import { PrivateLayout } from "../layout/PrivateLayout";
import { DashboardPage } from "../pages/DashboardPage";

export const privateRoutes: RouteObject[] = [
  {
    element: <PrivateLayout />,
    children: [
      { path: "/dashboard", element: <DashboardPage /> },
      { path: "/groups", element: <MyGroupsPage /> },
      { path: "/groups/:groupId", element: <GroupDetailPage /> },
      { path: "/expenses", element: <ExpensesPage /> },
      { path: "/settlement", element: <SettlementPage /> },
      { path: "/receipts", element: <ReceiptsPage /> },
      { path: "/settings", element: <SettingsPage /> },
      { path: "/profile", element: <Navigate to="/settings" replace /> },
    ],
  },
];
