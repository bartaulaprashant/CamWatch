import { Camera, Maximize2, VolumeX } from "lucide-react";

export default function CameraCard({ camera, connected = false }) {
  const cameraLabel = camera
    ? `CAM-${String(camera.id).padStart(3, "0")}`
    : "CAM-001";

  return (
    <div className="camera-card">
      <div className="camera-card-header">
        <div>
          <div className="camera-name">
            <span className={`status-dot ${connected ? "online" : ""}`} />
            <strong>{camera?.name || "Main Camera"}</strong>
          </div>
          <span className="camera-subtitle">
            {cameraLabel} · Device {camera?.device_index ?? 0}
          </span>
        </div>

        <span className="camera-live-badge">{connected ? "LIVE" : "OFFLINE"}</span>
      </div>

      <div className="camera-preview">
        <div className="camera-placeholder">
          <Camera size={38} />
          <strong>Camera feed available on Live Monitoring</strong>
          <span>{connected ? "Camera service connected" : "Waiting for camera service"}</span>
        </div>

        <div className="camera-overlay-top">
          <span>{cameraLabel}</span>
          <span>LOCAL FEED</span>
        </div>

        <div className="camera-overlay-bottom">
          <span>{connected ? "SERVICE ACTIVE" : "NO SIGNAL"}</span>
          <div>
            <button aria-label="Mute audio"><VolumeX size={16} /></button>
            <button aria-label="Fullscreen"><Maximize2 size={16} /></button>
          </div>
        </div>
      </div>

      <div className="camera-card-footer">
        <span><span className={`status-dot ${connected ? "online" : ""}`} /> Camera service</span>
        <span>{connected ? "Preview available" : "Preview unavailable"}</span>
      </div>
    </div>
  );
}
