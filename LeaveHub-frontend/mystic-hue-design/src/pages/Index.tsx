import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import Sidebar from "@/components/Sidebar";
import Dashboard from "@/pages/Dashboard";
import EmployeesPage from "@/pages/EmployeesPage";
import LeaveRequestsPage from "@/pages/LeaveRequestsPage";
import ApprovalsPage from "@/pages/ApprovalsPage";

const Index = () => {
  const { user, role, loading } = useAuth();
  const [activePage, setActivePage] = useState("dashboard");

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground font-mono text-sm animate-pulse">loading.session...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const renderPage = () => {
    switch (activePage) {
      case "dashboard": return <Dashboard />;
      case "employees": return (role === "admin" || role === "manager") ? <EmployeesPage /> : <Dashboard />;
      case "requests": return role === "employee" ? <LeaveRequestsPage /> : <Dashboard />;
      case "approvals": return (role === "admin" || role === "manager") ? <ApprovalsPage /> : <Dashboard />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Sidebar active={activePage} onNavigate={setActivePage} role={role} />
      <main className="md:ml-64 min-h-screen p-4 sm:p-6 pt-16 md:pt-6 pb-8">
        {renderPage()}
      </main>
    </div>
  );
};

export default Index;
