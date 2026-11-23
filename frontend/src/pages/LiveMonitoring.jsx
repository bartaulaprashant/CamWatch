import { useCallback, useEffect, useState } from "react";
import {
  Activity,
  Signal,
  Clock,
  ShieldCheck,
  Settings2
} from "lucide-react";
import CameraPlayer from "../components/CameraPlayer";
import { cameraAPI } from "../services/api";

function formatUptime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return [hours, minutes, secs]
    .map((value) => String(value).padStart(2, "0"))
    .join(":");
}

export default function LiveMonitoring() {
  const [health, setHealth] = useState(null);
  const [camera, setCamera] = useState(null);
  const [streamState, setStreamState] = useState({
    status: "Disconnected",
    connected: false,
    streaming: false,
  });
  const [uptimeSeconds, setUptimeSeconds] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function loadLiveData() {
      try {
        const [cameraList, healthStatus] = await Promise.all([
          cameraAPI.list(),
          cameraAPI.health(),
        ]);

        if (cancelled) return;

        const enabledCamera = cameraList.find((item) => item.is_enabled);
        setCamera(enabledCamera || cameraList[0] || null);
        setHealth(healthStatus);
      } catch (error) {
        if (!cancelled) {
          setHealth({ running: false, last_error: error.message });
        }
      }
    }

    loadLiveData();
    const poll = window.setInterval(loadLiveData, 3000);

    return () => {
      cancelled = true;
      window.clearInterval(poll);
    };
  }, []);

  useEffect(() => {
    if (!streamState.connected) {
      setUptimeSeconds(0);
      return;
    }

    setUptimeSeconds(0);
    const timer = window.setInterval(() => {
      setUptimeSeconds((value) => value + 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [streamState.connected]);

  const handleStatusChange = useCallback((nextState) => {
    setStreamState(nextState);
  }, []);

  const serviceReady = Boolean(health?.running);
  const streamStatus = streamState.connected
    ? "Connected"
    : streamState.status || "Disconnected";
  const cameraLabel = camera
    ? `CAM-${String(camera.id).padStart(3, "0")}`
    : "CAM-001";
  const playerCamera = camera
    ? {
        name: camera.name,
        id: cameraLabel,
        label: `Device ${camera.device_index}`,
      }
    : null;

  return (
    <main className="dashboard live-page">
      <section className="page-heading">
        <div>
          <span className="eyebrow">CAMERA OPERATIONS / 01</span>
          <h1>Live Monitoring</h1>
          <p>Monitor your camera feed and system activity in real time.</p>
        </div>

        <div className="monitoring-status">
          <span className={`status-dot ${serviceReady ? "online" : ""}`} />
          {serviceReady ? "CAMERA SERVICE READY" : "CAMERA SERVICE OFFLINE"}
        </div>
      </section>

      <section className="live-layout">
        <div className="live-main">
          <CameraPlayer
            camera={playerCamera}
            onStatusChange={handleStatusChange}
          />

          <div className="live-info-grid">
            <div className="live-info-card">
              <div className="info-icon green">
                <Activity size={19} />
              </div>
              <div>
                <span>MOTION DETECTION</span>
                <strong>{health?.motion_detected ? "Motion detected" : (serviceReady ? "Monitoring" : "Unavailable")}</strong>
              </div>
            </div>

            <div className="live-info-card">
              <div className="info-icon blue">
                <Signal size={19} />
              </div>
              <div>
                <span>STREAM STATUS</span>
                <strong>{streamStatus}</strong>
              </div>
            </div>

            <div className="live-info-card">
              <div className="info-icon purple">
                <Clock size={19} />
              </div>
              <div>
                <span>UPTIME</span>
                <strong>{streamState.connected ? formatUptime(uptimeSeconds) : ""}</strong>
              </div>
            </div>
          </div>
        </div>

        <aside className="live-sidebar">
          <div className="live-side-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">DEVICE</span>
                <h2>Camera details</h2>
              </div>
              <Settings2 size={18} />
            </div>

            <div className="device-detail">
              <span>Camera name</span>
              <strong>{camera?.name || "No camera configured"}</strong>
            </div>

            <div className="device-detail">
              <span>Device index</span>
              <strong>{camera ? camera.device_index : "—"}</strong>
            </div>

            <div className="device-detail">
              <span>Source</span>
              <strong>{camera ? "Local webcam" : "Unavailable"}</strong>
            </div>

            <div className="device-detail">
              <span>Connection</span>
              <strong className={streamState.connected ? "text-success" : "text-warning"}>
                {streamState.connected ? "Connected" : streamStatus}
              </strong>
            </div>
          </div>

          <div className="live-side-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">SECURITY</span>
                <h2>Detection status</h2>
              </div>
            </div>

            <div className="detection-status">
              <div className="detection-icon"><ShieldCheck size={21} /></div>
              <div>
                <strong>{serviceReady ? "Motion detection active" : "Motion detection unavailable"}</strong>
                <span>{health?.motion_detected ? "Activity detected" : (serviceReady ? "Monitoring for activity" : (health?.last_error || "Waiting for camera service"))}</span>
              </div>
            </div>
          </div>

          <div className="live-side-section">
            <div className="section-heading">
              <div>
                <span className="eyebrow">SYSTEM</span>
                <h2>Stream information</h2>
              </div>
            </div>

            <div className="device-detail">
              <span>Transport</span><strong>WebRTC</strong>
            </div>
            <div className="device-detail">
              <span>Active viewers</span><strong>{health?.active_viewers ?? 0}</strong>
            </div>
            <div className="device-detail">
              <span>Captured frames</span><strong>{health?.frame_count ?? 0}</strong>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}
