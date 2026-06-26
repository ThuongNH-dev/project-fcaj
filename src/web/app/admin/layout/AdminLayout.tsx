import { Outlet } from "react-router";
import { AdminRoute } from "../guards/AdminRoute";

export function AdminLayout() {
  return (
    <AdminRoute>
      <Outlet />
    </AdminRoute>
  );
}
