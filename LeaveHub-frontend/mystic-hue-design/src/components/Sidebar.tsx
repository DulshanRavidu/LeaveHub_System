import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  CheckSquare,
  Menu,
  X,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const allNavItems = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard, roles: ["admin", "manager", "employee"] },
  { id: "employees", label: "Employees", icon: Users, roles: ["admin", "manager"] },
  { id: "requests", label: "Leave Requests", icon: CalendarDays, roles: ["employee"] },
  { id: "approvals", label: "Approvals", icon: CheckSquare, roles: ["admin", "manager"] },
];

interface SidebarProps {
  active: string;
  onNavigate: (id: string) => void;
  role: string | null;
}

const Sidebar = ({ active, onNavigate, role }: SidebarProps) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { profile, signOut } = useAuth();
  const navigate = useNavigate();

  const navItems = allNavItems.filter((item) => role && item.roles.includes(role));

  const initials = profile?.fullName
    ? profile.fullName.split(" ").map((n) => n[0]).join("").toUpperCase()
    : "??";

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const NavContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-6 py-6 border-b border-border">
        <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight text-foreground">
          <img src="/leavehub-logo.jpg" alt="LeaveHub logo" className="w-10 h-10 rounded-md" />
          <span>
            Leave<span className="text-primary">Hub</span>
          </span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">ABC Company</p>
      </div>

      <nav className="flex-1 py-6 px-4 space-y-3">
        {navItems.map((item) => (
          <motion.button
            key={item.id}
            whileHover={{ x: 4 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => {
              onNavigate(item.id);
              setMobileOpen(false);
            }}
            className={`flex items-center gap-4 px-4 py-3.5 w-full text-lg font-medium rounded-md transition-colors ${
              active === item.id
                ? "text-foreground bg-secondary"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <div className="relative">
              {active === item.id && (
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary glow-dot" />
              )}
              <item.icon className="w-5 h-5 ml-1" />
            </div>
            {item.label}
          </motion.button>
        ))}
      </nav>

      <div className="p-4 border-t border-border">
        <div className="flex items-center gap-3 px-2">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-mono text-primary">
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{profile?.fullName ?? "User"}</p>
            <p className="text-xs text-muted-foreground">{role ?? "employee"}</p>
          </div>
          <button onClick={handleLogout} className="text-muted-foreground hover:text-foreground transition-colors">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 p-2 rounded-md bg-card border border-border md:hidden"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      <aside className="hidden md:flex w-64 flex-col h-screen bg-sidebar border-r border-border fixed left-0 top-0">
        <NavContent />
      </aside>

      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
            />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="fixed left-0 top-0 w-64 h-screen bg-sidebar border-r border-border z-50 md:hidden"
            >
              <NavContent />
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
