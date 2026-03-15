import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import ParticipantsPage from "@/pages/ParticipantsPage";
import ParticipantDetailPage from "@/pages/ParticipantDetailPage";
import WorkersPage from "@/pages/WorkersPage";
import SchedulesPage from "@/pages/SchedulesPage";
import ServicesPage from "@/pages/ServicesPage";
import ClaimsPage from "@/pages/ClaimsPage";
import IncidentsPage from "@/pages/IncidentsPage";
import ComplaintsPage from "@/pages/ComplaintsPage";
import ReportsPage from "@/pages/ReportsPage";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><p className="text-zinc-500">Loading...</p></div>;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
}

function AppRoutes() {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><p className="text-zinc-500">Loading...</p></div>;

  return (
    <Routes>
      <Route path="/login" element={user ? <Navigate to="/" /> : <LoginPage />} />
      <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
        <Route index element={<DashboardPage />} />
        <Route path="participants" element={<ParticipantsPage />} />
        <Route path="participants/:id" element={<ParticipantDetailPage />} />
        <Route path="workers" element={<WorkersPage />} />
        <Route path="schedules" element={<SchedulesPage />} />
        <Route path="services" element={<ServicesPage />} />
        <Route path="claims" element={<ClaimsPage />} />
        <Route path="incidents" element={<IncidentsPage />} />
        <Route path="complaints" element={<ComplaintsPage />} />
        <Route path="reports" element={<ReportsPage />} />
      </Route>
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
