import type { RouteObject } from "react-router";
import { ForgotPasswordPage } from "../../../domains/auth/pages/ForgotPasswordPage";
import { LoginPage } from "../../../domains/auth/pages/LoginPage";
import { ResetPasswordPage } from "../../../domains/auth/pages/ResetPasswordPage";
import { PublicLayout } from "../layout/PublicLayout";
import { LandingPage } from "../pages/LandingPage";

export const publicRoutes: RouteObject[] = [
  {
    path: "/",
    element: <PublicLayout />,
    children: [
      { index: true, element: <LandingPage section="landing" /> },
      { path: "features", element: <LandingPage section="features" /> },
      { path: "pricing", element: <LandingPage section="pricing" /> },
      { path: "about", element: <LandingPage section="about" /> },
      { path: "login", element: <LoginPage initialMode="login" /> },
      { path: "register", element: <LoginPage initialMode="register" /> },
      { path: "forgot-password", element: <ForgotPasswordPage /> },
      { path: "reset-password", element: <ResetPasswordPage /> },
    ],
  },
];
