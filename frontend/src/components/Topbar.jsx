
import { Bell, Search, Menu } from "lucide-react";

export default function Topbar() {
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
      </div>
    </header>
  );
}
