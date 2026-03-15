import { Link, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard, Users, UserCog, Calendar, ClipboardList,
  DollarSign, AlertTriangle, MessageSquareWarning, BarChart3, LogOut, Menu, X
} from "lucide-react";
import { useState } from "react";

const navItems = [
  { path: "/", label: "Dashboard", icon: LayoutDashboard },
  { path: "/participants", label: "Participants", icon: Users },
  { path: "/workers", label: "Workers", icon: UserCog },
  { path: "/schedules", label: "Scheduling", icon: Calendar },
  { path: "/services", label: "Service Delivery", icon: ClipboardList },
  { path: "/claims", label: "Claims & Billing", icon: DollarSign },
  { path: "/incidents", label: "Incidents", icon: AlertTriangle },
  { path: "/complaints", label: "Complaints", icon: MessageSquareWarning },
  { path: "/reports", label: "Reports", icon: BarChart3 },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="flex h-screen bg-zinc-50">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-zinc-900 text-white transform transition-transform lg:relative lg:translate-x-0 ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}`}>
        <div className="flex items-center justify-between p-4 border-b border-zinc-700">
          <div>
            <h1 className="text-lg font-bold">NDIS Manager</h1>
            <p className="text-xs text-zinc-400">Provider Management System</p>
          </div>
          <button className="lg:hidden text-zinc-400" onClick={() => setSidebarOpen(false)}>
            <X className="h-5 w-5" />
          </button>
        </div>
        <nav className="p-3 space-y-1 flex-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path !== "/" && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-zinc-300 hover:bg-zinc-800 hover:text-white"
                }`}
              >
                <item.icon className="h-4 w-4 flex-shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="p-3 border-t border-zinc-700">
          <div className="px-3 py-2 text-sm">
            <p className="font-medium text-white truncate">{user?.full_name}</p>
            <p className="text-xs text-zinc-400 capitalize">{user?.role?.replace("_", " ")}</p>
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-zinc-300 hover:text-white hover:bg-zinc-800"
            onClick={logout}
          >
            <LogOut className="h-4 w-4 mr-2" /> Sign Out
          </Button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b px-4 py-3 flex items-center gap-3 lg:hidden">
          <button onClick={() => setSidebarOpen(true)}>
            <Menu className="h-5 w-5" />
          </button>
          <h1 className="font-semibold">NDIS Manager</h1>
        </header>
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
