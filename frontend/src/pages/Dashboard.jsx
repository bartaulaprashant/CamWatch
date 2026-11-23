import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Camera,
  Activity,
  BellRing,
  HardDrive,
  ArrowUpRight,
  Clock3,
  ShieldCheck
} from "lucide-react";

import StatCard from "../components/StatCard";
import CameraCard from "../components/CameraCard";
import { cameraAPI, eventAPI } from "../services/api";

function relativeTime(value) {
  const elapsed = Math.max(0, Date.now() - new Date(value).getTime());
  const minutes = Math.floor(elapsed / 60000);
  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [cameras, setCameras] = useState([]);
  const [health, setHealth] = useState(null);
  const [eventData, setEventData] = useState({ total: 0, events: [] });
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([
      cameraAPI.list(),
      cameraAPI.health(),
      eventAPI.list(5, 0),
    ]).then(([cameraList, healthStatus, events]) => {
      setCameras(cameraList);
      setHealth(healthStatus);
      setEventData(events);
    }).catch((err) => setError(err.message));
  }, []);

  const enabledCameras = cameras.filter((camera) => camera.is_enabled);
  const primaryCamera = enabledCameras[0] || cameras[0];
  const healthy = Boolean(health?.running);

  return (
    <main className="dashboard">
      <section className="page-heading">
        <div>
          <span className="eyebrow">SYSTEM OVERVIEW</span>
          <h1>Good to see you.</h1>
          <p>Here's what's happening with your security system.</p>
        </div>
        <div className="date-label"><Clock3 size={16} /><span>Local monitoring</span></div>
      </section>

      {error && <div className="stream-error">{error}</div>}

      <section className="stats-grid">
        <StatCard title="Connected Cameras" value={String(enabledCameras.length)} description={`${cameras.length} camera${cameras.length === 1 ? "" : "s"} configured`} icon={Camera} accent="green" />
        <StatCard title="Motion Events" value={String(eventData.total)} description={`${eventData.events.length} recent event${eventData.events.length === 1 ? "" : "s"}`} icon={Activity} accent="amber" />
        <StatCard title="Notifications" value="OFF" description="Email notifications not configured" icon={BellRing} accent="blue" />
        <StatCard title="Storage" value="LOCAL" description="Snapshots stored on this device" icon={HardDrive} accent="purple" />
      </section>

      <section className="main-grid">
        <div className="primary-column">
          <div className="section-heading">
            <div><span className="eyebrow">MONITORING</span><h2>Camera overview</h2></div>
            <button className="text-button" onClick={() => navigate("/live")}>View cameras <ArrowUpRight size={16} /></button>
          </div>

          {primaryCamera ? (
            <CameraCard camera={primaryCamera} connected={healthy} />
          ) : (
            <div className="camera-card"><div className="camera-placeholder"><Camera size={38} /><strong>No cameras configured</strong><span>Add a camera in Settings</span></div></div>
          )}

          <div className="system-health">
            <div className="health-icon"><ShieldCheck size={20} /></div>
            <div><strong>{healthy ? "Camera service operational" : "Camera service unavailable"}</strong><span>{healthy ? "System is ready to monitor activity." : (health?.last_error || "No active camera frame detected.")}</span></div>
            <span className="health-status">{healthy ? "HEALTHY" : "OFFLINE"}</span>
          </div>
        </div>

        <aside className="events-panel">
          <div className="section-heading">
            <div><span className="eyebrow">ACTIVITY LOG</span><h2>Recent events</h2></div>
            <button className="icon-button" aria-label="View event history" onClick={() => navigate("/events")}><ArrowUpRight size={18} /></button>
          </div>

          <div className="event-list">
            {eventData.events.length === 0 ? (
              <div className="event-item"><div className="event-content"><strong>No motion events</strong><span>Events will appear here</span></div></div>
            ) : eventData.events.map((event) => (
              <div className="event-item" key={event.id}>
                <div className="event-icon"><Activity size={17} /></div>
                <div className="event-content"><strong>{event.description || "Motion detected"}</strong><span>Camera {event.camera_id} · EVT-{String(event.id).padStart(4, "0")}</span></div>
                <span className="event-time">{relativeTime(event.created_at)}</span>
              </div>
            ))}
          </div>

          <button className="view-all-button" onClick={() => navigate("/events")}>View all events <ArrowUpRight size={16} /></button>
        </aside>
      </section>

      <footer className="dashboard-footer"><span>CAMWATCH SECURITY CONSOLE</span><span>LOCAL SYSTEM · V1.0.0</span></footer>
    </main>
  );
}
