import { useState } from "react";
import { LanguageProvider } from "./context/LanguageContext";
import { Navbar } from "./components/Navbar";
import { Sidebar } from "./components/Sidebar";
import { LandingPage } from "./components/LandingPage";
import { LoginPage } from "./components/LoginPage";
import { Dashboard } from "./components/Dashboard";
import { GroupsPage } from "./components/GroupsPage";
import { GroupDetailPage } from "./components/GroupDetailPage";
import { AddExpenseModal } from "./components/AddExpenseModal";
import { SettlementPage } from "./components/SettlementPage";
import { AdminPage } from "./components/AdminPage";
import { ExpensesPage } from "./components/ExpensesPage";
import { ReceiptsPage } from "./components/ReceiptsPage";
import { SettingsPage } from "./components/SettingsPage";
import { FeedbackProvider } from "./components/ui/FeedbackProvider";
import { getStoredUser } from "./api/auth";

export default function App() {
  const [currentPage, setCurrentPage] = useState(() =>
    getStoredUser() ? "dashboard" : "landing",
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
  };

  const showSidebar =
    currentPage === "dashboard" ||
    currentPage === "groups" ||
    currentPage === "group-detail" ||
    currentPage === "settlement" ||
    currentPage === "admin" ||
    currentPage === "settings" ||
    currentPage === "expenses" ||
    currentPage === "receipts";

  const renderPage = () => {
    switch (currentPage) {
      case "landing":
      case "features":
      case "pricing":
      case "about":
        return <LandingPage onNavigate={handleNavigate} section={currentPage} />;
      case "login":
        return <LoginPage onNavigate={handleNavigate} initialMode="login" />;
      case "register":
        return <LoginPage onNavigate={handleNavigate} initialMode="register" />;
      case "dashboard":
        return <Dashboard />;
      case "groups":
        return (
          <GroupsPage
            onNavigate={handleNavigate}
            onSelectGroup={setSelectedGroupId}
          />
        );
      case "group-detail":
        return (
          <GroupDetailPage
            onNavigate={handleNavigate}
            onOpenModal={() => setIsModalOpen(true)}
            groupId={selectedGroupId}
          />
        );
      case "settlement":
        return <SettlementPage />;
      case "admin":
        return <AdminPage />;
      case "expenses":
        return <ExpensesPage />;
      case "receipts":
        return <ReceiptsPage />;
      case "settings":
        return <SettingsPage onNavigate={handleNavigate} />;
      default:
        return <LandingPage onNavigate={handleNavigate} />;
    }
  };

  return (
    <LanguageProvider>
      <FeedbackProvider>
        <div className="min-h-screen bg-[#F6FBF8]">
          {!showSidebar && (
            <Navbar onNavigate={handleNavigate} currentPage={currentPage} />
          )}
          {showSidebar && (
            <Sidebar currentPage={currentPage} onNavigate={handleNavigate} />
          )}
          <div className={showSidebar ? "flex-1" : ""}>
            {renderPage()}
          </div>
          <AddExpenseModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
          />
        </div>
      </FeedbackProvider>
    </LanguageProvider>
  );
}
