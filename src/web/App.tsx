import { AppRoutes } from "./app/routes/AppRoutes";
import { AppearanceProvider } from "./shared/providers/AppearanceProvider";
import { LanguageProvider } from "./shared/providers/LanguageProvider";
import { FeedbackProvider } from "./shared/providers/FeedbackProvider";

export default function App() {
  return (
    <AppearanceProvider>
      <LanguageProvider>
        <FeedbackProvider>
          <AppRoutes />
        </FeedbackProvider>
      </LanguageProvider>
    </AppearanceProvider>
  );
}

