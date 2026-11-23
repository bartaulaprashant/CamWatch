
import {
  LayoutDashboard,
  Camera,
  History,
  Settings,
  Shield,
  CircleHelp
} from "lucide-react";

import { NavLink } from "react-router-dom";

const navigation = [
  { label: "Overview", icon: LayoutDashboard, path: "/" },
  { label: "Live Monitoring", icon: Camera, path: "/live" },
  { label: "Event History", icon: History, path: "/events" },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">
          <Shield size={23} />
        </div>
        <div>
          <h2>CamWatch</h2>
          <span>SECURITY SYSTEM</span>
        </div>
      </div>

      <div className="nav-section">
        <span className="nav-heading">WORKSPACE</span>

        {navigation.map((item) => {
          const Icon = item.icon;

          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              className={({ isActive }) =>
                `nav-item ${isActive ? "active" : ""}`
              }
            >
              <Icon size={18} />
              <span>{item.label}</span>
              {item.path === "/" && (
                <span className="active-dot" />
              )}
            </NavLink>
          );
        })}
      </div>

      <div className="nav-section">
        <span className="nav-heading">SYSTEM</span>

        <NavLink to="/settings" className={({ isActive }) =>
          `nav-item ${isActive ? "active" : ""}`
        }>
          <Settings size={18} />
          <span>Settings</span>
        </NavLink>

        <button className="nav-item">
          <CircleHelp size={18} />
          <span>Help & Support</span>
        </button>
      </div>

      <div className="sidebar-bottom">
        <div className="sidebar-status">
          <span className="status-dot online" />
          <div>
            <strong>System Online</strong>
            <span>Local server active</span>
          </div>
        </div>

        <div className="sidebar-footer">
          <span>CAMWATCH</span>
          <span>V1.0.0</span>
        </div>
      </div>
    </aside>
  );
}
