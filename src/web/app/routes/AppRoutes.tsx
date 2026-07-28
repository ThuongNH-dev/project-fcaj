import { Navigate, useRoutes, type RouteObject } from "react-router";
import { useStoredUser } from "../../domains/auth";
import { adminRoutes } from "../admin/routes/AdminRoutes";
import { privateRoutes } from "../private/routes/PrivateRoutes";
import { publicRoutes } from "../public/routes/PublicRoutes";

export function AppRoutes() {
  const user = useStoredUser();

  const routes: RouteObject[] = [
    ...publicRoutes,
    ...privateRoutes,
    ...adminRoutes,
    {
      path: "*",
      element: (
        <Navigate
          to={user ? (user.role === "admin" ? "/admin" : "/dashboard") : "/login"}
          replace
        />
      ),
    },
  ];

  return useRoutes(routes);
}
