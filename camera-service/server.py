import os
import asyncio
from contextlib import asynccontextmanager
from pathlib import Path

from dotenv import load_dotenv

PROJECT_ROOT = Path(__file__).resolve().parent.parent
load_dotenv(PROJECT_ROOT / ".env")

from audio_manager import AudioManager
from fastapi import Depends

from fastapi import FastAPI, HTTPException
from starlette.middleware.sessions import SessionMiddleware
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel


from backend.models import User 
from backend.auth import get_current_user
from backend.auth_routes import router as auth_router
from backend.camera_routes import router as camera_router
from backend.event_routes import router as event_router

from aiortc import (
    RTCPeerConnection,
    RTCSessionDescription
)

from camera_manager import CameraManager
from video_track import CameraVideoTrack


# Initialize camera manager
camera = CameraManager()

# Store active WebRTC connections
peer_connections = set()

audio_manager = AudioManager()

# Store audio subscriptions by peer connection
audio_connections = {}


# Request structure for WebRTC signaling
class Offer(BaseModel):
    sdp: str
    type: str
    audio_enabled: bool = False

def cleanup_connection(pc):

    peer_connections.discard(pc)

    audio_track = audio_connections.pop(pc, None)

    if audio_track:
        audio_track.stop()

    # Stop microphone when no viewers need audio
    if not audio_connections and audio_manager.running:
        audio_manager.stop()

# Manage application startup and shutdown
@asynccontextmanager
async def lifespan(app: FastAPI):

    camera.start()

    print("CamWatch camera service is running.")

    yield

    # Close all active WebRTC connections
    await asyncio.gather(
        *(pc.close() for pc in list(peer_connections)),
        return_exceptions=True
    )

    for pc in list(peer_connections):
        cleanup_connection(pc)

    audio_manager.stop()
    camera.stop()


app = FastAPI(lifespan=lifespan)

app.include_router(auth_router)
app.include_router(camera_router)
app.include_router(event_router)

session_secret = os.getenv("CAMWATCH_SESSION_SECRET")

if not session_secret:
    raise RuntimeError("CAMWATCH_SESSION_SECRET is not configured")

# Use CAMWATCH_HTTPS_ONLY=false when the browser frontend is served over
# plain HTTP on a LAN. HTTPS deployments should keep the default enabled.
cookie_https_only = os.getenv(
    "CAMWATCH_HTTPS_ONLY",
    "true"
).strip().lower() in ("1", "true", "yes", "on")

print(
    "Session cookie Secure flag:",
    "ENABLED" if cookie_https_only else "DISABLED",
    f"(CAMWATCH_HTTPS_ONLY={os.getenv('CAMWATCH_HTTPS_ONLY', 'unset')})"
)

app.add_middleware(
    SessionMiddleware,
    secret_key=session_secret,
    session_cookie="camwatch_session",
    max_age=60 * 60 * 24 * 7,
    same_site="lax",
    https_only=cookie_https_only
)


# Serve the test webpage
@app.get("/")
async def home():

    html_path = Path(__file__).parent / "static" / "index.html"

    return FileResponse(html_path)


# Camera health information
@app.get("/health")
async def health(user: User = Depends(get_current_user)):
    status = camera.get_status()
    status["active_viewers"] = len(peer_connections)
    return status


# WebRTC signaling endpoint
@app.post("/offer")
async def create_offer(
    offer: Offer,
    user: User = Depends(get_current_user)
):
    pc = RTCPeerConnection()
    peer_connections.add(pc)

    @pc.on("connectionstatechange")
    async def on_connection_state_change():

        print("WebRTC state:", pc.connectionState)

        if pc.connectionState in ("failed", "closed"):
            await pc.close()
            cleanup_connection(pc)

        elif pc.connectionState == "disconnected":
            await asyncio.sleep(2)

            if pc.connectionState == "disconnected":
                await pc.close()
                cleanup_connection(pc)

    try:
        await pc.setRemoteDescription(
            RTCSessionDescription(
                sdp=offer.sdp,
                type=offer.type
            )
        )

        # Video is always enabled
        pc.addTrack(CameraVideoTrack(camera))

        # Audio is optional
        if offer.audio_enabled:

            try:
                if not audio_manager.running:
                    audio_manager.start()

                audio_track = audio_manager.get_track()
                audio_connections[pc] = audio_track
                pc.addTrack(audio_track)
            except Exception as audio_error:
                print("Microphone unavailable:", audio_error)

        answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)

        return {
            "sdp": pc.localDescription.sdp,
            "type": pc.localDescription.type
        }

    except Exception as error:

        await pc.close()
        cleanup_connection(pc)

        raise HTTPException(
            status_code=500,
            detail=str(error)
        )