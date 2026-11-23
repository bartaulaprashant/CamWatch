import { useEffect, useRef, useState } from "react";

import {
  Camera,
  Maximize2,
  Volume2,
  VolumeX,
  Mic,
  Activity
} from "lucide-react";

import { streamAPI } from "../services/api";

export default function CameraPlayer({ onStatusChange, camera }) {
  const videoRef = useRef(null);
  const peerRef = useRef(null);

  const [status, setStatus] = useState("Disconnected");
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [muted, setMuted] = useState(true);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState("");

  async function waitForIceGathering(pc) {
    if (pc.iceGatheringState === "complete") return;

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("ICE gathering timed out"));
      }, 15000);

      function checkState() {
        if (pc.iceGatheringState === "complete") {
          clearTimeout(timeout);
          pc.removeEventListener(
            "icegatheringstatechange",
            checkState
          );
          resolve();
        }
      }

      pc.addEventListener(
        "icegatheringstatechange",
        checkState
      );

      checkState();
    });
  }

  async function startStream() {
    if (peerRef.current) return;

    let pc;

    try {
      setError("");
      setStatus("Connecting...");

      pc = new RTCPeerConnection();
      peerRef.current = pc;

      pc.addTransceiver("video", {
        direction: "recvonly"
      });

      if (audioEnabled) {
        pc.addTransceiver("audio", {
          direction: "recvonly"
        });
      }

      pc.ontrack = (event) => {
        let stream;

        if (event.streams.length > 0) {
          stream = event.streams[0];
        } else {
          stream = videoRef.current?.srcObject;

          if (!stream) {
            stream = new MediaStream();
          }

          stream.addTrack(event.track);
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.muted = true;
          videoRef.current.play().catch(console.error);
        }
      };

      pc.onconnectionstatechange = () => {
        const connectionState = pc.connectionState;

        if (peerRef.current !== pc) return;

        setStatus(connectionState);

        if (
          connectionState === "failed" ||
          connectionState === "closed"
        ) {
          stopStream();
        }
      };

      const offer = await pc.createOffer();

      await pc.setLocalDescription(offer);
      await waitForIceGathering(pc);

      const answer = await streamAPI.createOffer(
        pc.localDescription.sdp,
        pc.localDescription.type,
        audioEnabled
      );

      if (peerRef.current !== pc) return;

      await pc.setRemoteDescription(answer);

      setStreaming(true);
      setStatus("Connected");
      setMuted(true);

    } catch (err) {
      console.error("WebRTC error:", err);

      setError(err.message);
      setStatus("Connection failed");

      if (pc && peerRef.current === pc) {
        stopStream();
      }
    }
  }

  function stopStream() {
    const pc = peerRef.current;

    peerRef.current = null;

    if (pc) {
      pc.ontrack = null;
      pc.onconnectionstatechange = null;
      pc.close();
    }

    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.srcObject = null;
    }

    setStreaming(false);
    setMuted(true);
    setStatus("Disconnected");
  }

  function toggleMute() {
    const nextMuted = !muted;

    setMuted(nextMuted);

    if (videoRef.current) {
      videoRef.current.muted = nextMuted;
    }
  }

  function toggleFullscreen() {
    if (!videoRef.current) return;

    const player = videoRef.current.parentElement;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      player.requestFullscreen();
    }
  }

  useEffect(() => {
    return () => {
      const pc = peerRef.current;
      peerRef.current = null;

      if (pc) {
        pc.close();
      }
    };
  }, []);

  useEffect(() => {
    if (!onStatusChange) return;

    onStatusChange({
      status,
      connected: streaming && status.toLowerCase() === "connected",
      streaming,
    });
  }, [status, streaming, onStatusChange]);

  const connected = streaming && status.toLowerCase() === "connected";

  return (
    <div className="camera-card live-player-card">
      <div className="live-player-header">
        <div>
          <div className="camera-name">
            <span className={`status-dot ${connected ? "online" : ""}`} />
            <strong>{camera?.name || "Main Camera"}</strong>
          </div>

          <span className="camera-subtitle">
            {camera?.id || "CAM-001"} · {camera?.label || "Integrated Webcam"}
          </span>
        </div>

        <span className={`live-label ${connected ? "connected" : ""}`}>
          <span />
          {connected ? "LIVE" : "OFFLINE"}
        </span>
      </div>

      <div className="live-player">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
        />

        {!connected && (
          <div className="live-placeholder">
            <Camera size={45} />

            <h3>
              {status === "Connecting..."
                ? "Connecting to camera..."
                : "Camera stream disconnected"}
            </h3>

            <p>
              {status === "Connecting..."
                ? "Establishing WebRTC connection"
                : "Start the stream to view your camera"}
            </p>

            <span className="connection-state">
              <Activity size={12} />
              {status.toUpperCase()}
            </span>
          </div>
        )}

        <div className="player-top-overlay">
          <span>{camera?.id || "CAM-001"}</span>
          <span>LOCAL FEED</span>
        </div>

        <div className="player-bottom-overlay">
          <span>CAMWATCH / LIVE VIEW</span>
          <span>{connected ? "STREAM ACTIVE" : "NO SIGNAL"}</span>
        </div>
      </div>

      {error && (
        <div className="stream-error">
          {error}
        </div>
      )}

      <div className="player-controls">
        <div className="player-controls-left">
          <label className="audio-option">
            <input
              type="checkbox"
              checked={audioEnabled}
              onChange={(e) => setAudioEnabled(e.target.checked)}
              disabled={streaming}
            />
            <Mic size={15} />
            Enable microphone
          </label>

          <button
            className="control-button"
            onClick={toggleMute}
            disabled={!streaming || !audioEnabled}
            title={muted ? "Unmute audio" : "Mute audio"}
          >
            {muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
          </button>

          <button
            className="control-button"
            onClick={toggleFullscreen}
            disabled={!streaming}
            title="Fullscreen"
          >
            <Maximize2 size={17} />
          </button>
        </div>

        {!streaming ? (
          <button
            className="stream-button start"
            onClick={startStream}
            disabled={status === "Connecting..."}
          >
            Start Stream
          </button>
        ) : (
          <button
            className="stream-button stop"
            onClick={stopStream}
          >
            Stop Stream
          </button>
        )}
      </div>
    </div>
  );
}
