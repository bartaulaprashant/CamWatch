import { useState } from "react";
import { Bell, Search, LogOut } from "lucide-react";

export default function Topbar({ onLogout }) {
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    if (loggingOut) return;

    setLoggingOut(true);

    try {
      await onLogout();
    } catch (error) {
      console.error("Logout failed:", error);
      setLoggingOut(false);
    }
  }

  return (
    <header className="topbar">
      <div className="breadcrumb">
        <span>Workspace</span>
        <span className="breadcrumb-separator">/</span>
        <strong>Overview</strong>
      </div>

      <div className="topbar-actions">
        <div className="server-indicator">
          <span className="status-dot online" />
          Server Connected
        </div>

        <button className="icon-button" aria-label="Search">
          <Search size={19} />
        </button>

        <button className="icon-button notification-button" aria-label="Notifications">
          <Bell size={19} />
          <span />
        </button>

        <div className="user-avatar">CW</div>

        <button
          className="icon-button logout-button"
          aria-label="Logout"
          onClick={handleLogout}
          disabled={loggingOut}
        >
          <LogOut size={19} />
        </button>
      </div>
    </header>
  );
}
