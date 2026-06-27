import { Navigate, type RouteObject } from "react-router";
import { AdminLayout } from "../layout/AdminLayout";
import { AdminGroupsPage } from "../pages/AdminGroupsPage";
import { AdminLogsPage } from "../pages/AdminLogsPage";
import { AdminRejectedPage } from "../pages/AdminRejectedPage";
import { AdminSettlementsPage } from "../pages/AdminSettlementsPage";
import { AdminUploadsPage } from "../pages/AdminUploadsPage";
import { AdminUsersPage } from "../pages/AdminUsersPage";

export const adminRoutes: RouteObject[] = [
  {
    path: "/admin",
    element: <AdminLayout />,
    children: [
      { index: true, element: <Navigate to="users" replace /> },
      { path: "users", element: <AdminUsersPage /> },
      { path: "groups", element: <AdminGroupsPage /> },
      { path: "settlements", element: <AdminSettlementsPage /> },
      { path: "uploads", element: <AdminUploadsPage /> },
      { path: "rejected", element: <AdminRejectedPage /> },
      { path: "logs", element: <AdminLogsPage /> },
    ],
  },
];
