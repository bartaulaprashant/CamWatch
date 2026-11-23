import {
  BrowserRouter,
  Routes,
  Route
} from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";

import Sidebar from "./components/Sidebar";
import Topbar from "./components/Topbar";

import Dashboard from "./pages/Dashboard";
import LiveMonitoring from "./pages/LiveMonitoring";
import Login from "./pages/Login";
import EventHistory from "./pages/EventHistory";
import Settings from "./pages/Settings";

import "./App.css";

function AppContent() {
  const { user, loading, logout } = useAuth();

  if (loading) {
    return <div className="loading-screen">Loading CamWatch...</div>;
  }

  if (!user) {
    return <Login />;
  }

  return (
    <div className="app-shell">
      <Sidebar />

      <div className="main-area">
        <Topbar onLogout={logout} />

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/live" element={<LiveMonitoring />} />
          <Route path="/events" element={<EventHistory />} />
          <Route path="/settings" element={<Settings />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}
