import { Navigate, Route, Routes } from "react-router";
import { getStoredUser } from "./domains/auth";
import { PublicRoutes } from "./app/public/routes/PublicRoutes";
import { PrivateRoutes } from "./app/private/routes/PrivateRoutes";
import { LanguageProvider } from "./shared/providers/LanguageProvider";
import { FeedbackProvider } from "./shared/providers/FeedbackProvider";

export default function App() {
  return (
    <LanguageProvider>
      <FeedbackProvider>
        <Routes>
          <PublicRoutes />
          <PrivateRoutes />
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

