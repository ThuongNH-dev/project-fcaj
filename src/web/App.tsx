import { AppRoutes } from "./app/routes/AppRoutes";
import { LanguageProvider } from "./shared/providers/LanguageProvider";
import { FeedbackProvider } from "./shared/providers/FeedbackProvider";

export default function App() {
  return (
    <LanguageProvider>
      <FeedbackProvider>
        <AppRoutes />
      </FeedbackProvider>
    </LanguageProvider>
  );
}

