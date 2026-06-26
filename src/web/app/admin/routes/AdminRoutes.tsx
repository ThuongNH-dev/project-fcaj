import { Route } from "react-router";
import { AdminPage } from "../../../components/AdminPage";
import { AdminLayout } from "../layout/AdminLayout";

export function AdminRoutes() {
  return (
    <Route element={<AdminLayout />}>
      <Route path="/admin" element={<AdminPage />} />
    </Route>
  );
}
