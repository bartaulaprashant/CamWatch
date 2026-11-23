# CamWatch

A local webcam monitoring application with live WebRTC streaming, motion detection, authenticated access, and captured-event history.

CamWatch is a local security-monitoring platform that streams webcam video and audio, detects motion, records event snapshots, and provides camera status through an authenticated web dashboard.

## Features

- Secure login and session-based authentication
- Live webcam streaming through WebRTC
- Optional microphone audio
- OpenCV motion detection
- Motion event snapshots and history
- Camera configuration and enable/disable controls
- Real-time camera health and stream status
- Responsive React dashboard

## Tech Stack

- **Frontend:** React, React Router, Vite, JavaScript, CSS
- **Backend:** Python, FastAPI, Pydantic, Uvicorn
- **Database:** SQLite, SQLAlchemy
- **Vision/Media:** OpenCV, aiortc, PyAV, FFmpeg
- **Security:** Signed session cookies and pwdlib password hashing

## Getting Started

### Requirements

- Python 3.11+
- Node.js and npm
- Webcam
- FFmpeg for optional audio

### Backend

```bash
python -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
cp .env.example .env
```

Set `CAMWATCH_SESSION_SECRET` in `.env`, then initialize and start the backend:

```bash
PYTHONPATH=. python backend/init_db.py
cd camera-service
PYTHONPATH=.. CAMWATCH_SESSION_SECRET="replace-with-a-long-random-secret" \
  uvicorn server:app --host 0.0.0.0 --port 8000
```

TLS can be enabled with certificate options supported by Uvicorn.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Vite proxies `/api` requests to the backend configured in `frontend/vite.config.js`.

## Screenshots

Add screenshots inside `docs/screenshots/` and replace these placeholders:

- `docs/screenshots/dashboard.png`
- `docs/screenshots/live-monitoring.png`
- `docs/screenshots/event-history.png`

## Current Limitations

- Designed for a local, single-camera setup
- Event deletion and retention are not implemented
- Notification settings are placeholder functionality
- Database migrations and automated tests need to be added
- Multiple-camera configuration is not fully synchronized with capture hardware


## Security

This project uses a local signed-session cookie and is intended for local development. Use a strong session secret and do not expose it directly to untrusted networks without HTTPS and additional hardening.
