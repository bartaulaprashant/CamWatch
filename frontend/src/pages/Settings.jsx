import { useEffect, useState } from "react";
import { Camera, Plus, Save } from "lucide-react";
import { cameraAPI } from "../services/api";

export default function Settings() {
  const [cameras, setCameras] = useState([]);
  const [name, setName] = useState("");
  const [deviceIndex, setDeviceIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function loadCameras() {
    setLoading(true);
    try {
      setCameras(await cameraAPI.list());
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { loadCameras(); }, []);

  async function addCamera(event) {
    event.preventDefault();
    setSaving(true);
    setMessage("");
    try {
      await cameraAPI.create(name.trim(), Number(deviceIndex));
      setName("");
      setDeviceIndex(0);
      setMessage("Camera added successfully.");
      await loadCameras();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function toggleCamera(camera) {
    try {
      await cameraAPI.update(camera.id, { is_enabled: !camera.is_enabled });
      setError("");
      await loadCameras();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="dashboard">
      <section className="page-heading">
        <div>
          <span className="eyebrow">SYSTEM CONFIGURATION</span>
          <h1>Settings</h1>
          <p>Manage your CamWatch cameras and system configuration.</p>
        </div>
      </section>

      {error && <div className="stream-error">{error}</div>}
      {message && <div className="settings-message">{message}</div>}

      <div className="settings-grid">
        <section className="settings-panel">
          <div className="section-heading">
            <div><span className="eyebrow">CAMERAS</span><h2>Configured devices</h2></div>
          </div>

          {loading ? (
            <div className="settings-empty">Loading cameras...</div>
          ) : cameras.length === 0 ? (
            <div className="settings-empty">No cameras configured.</div>
          ) : (
            <div className="camera-settings-list">
              {cameras.map((camera) => (
                <div className="camera-setting-row" key={camera.id}>
                  <div className="camera-setting-icon"><Camera size={18} /></div>
                  <div className="camera-setting-name">
                    <strong>{camera.name}</strong>
                    <span>Device index {camera.device_index}</span>
                  </div>
                  <button
                    className={`toggle-button ${camera.is_enabled ? "enabled" : ""}`}
                    type="button"
                    onClick={() => toggleCamera(camera)}
                    aria-label={`${camera.is_enabled ? "Disable" : "Enable"} ${camera.name}`}
                  ><span /></button>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="settings-panel">
          <div className="section-heading">
            <div><span className="eyebrow">ADD DEVICE</span><h2>New camera</h2></div>
          </div>

          <form className="settings-form" onSubmit={addCamera}>
            <label>
              <span>Camera name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Front entrance"
                minLength={2}
                maxLength={100}
                required
              />
            </label>

            <label>
              <span>Device index</span>
              <input
                type="number"
                value={deviceIndex}
                onChange={(event) => setDeviceIndex(event.target.value)}
                min={0}
                required
              />
            </label>

            <button className="settings-save-button" type="submit" disabled={saving || name.trim().length < 2}>
              {saving ? <Save size={16} /> : <Plus size={16} />}
              {saving ? "Saving..." : "Add camera"}
            </button>
          </form>
        </section>
      </div>
    </main>
  );
}
