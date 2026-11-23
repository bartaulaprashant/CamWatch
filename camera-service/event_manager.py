
import cv2
import time

from pathlib import Path
from datetime import datetime, timezone
from uuid import uuid4
from threading import Lock

from backend.database import SessionLocal
from backend.models import Camera, MotionEvent


PROJECT_ROOT = Path(__file__).resolve().parent.parent
EVENTS_DIR = PROJECT_ROOT / "storage" / "events"


class EventManager:

    def __init__(self, cooldown=30):

        self.cooldown = cooldown
        self.last_event_time = {}

        self.lock = Lock()

        EVENTS_DIR.mkdir(parents=True, exist_ok=True)

    def process_motion(self, device_index, frame, regions):

        with self.lock:

            current_time = time.monotonic()

            # Check cooldown for this camera
            last_time = self.last_event_time.get(device_index, 0)

            if current_time - last_time < self.cooldown:
                return
                
            db = SessionLocal()
            image_path = None

            try:
                # Find the camera responsible for this event
                camera = db.query(Camera).filter(
                    Camera.device_index == device_index,
                    Camera.is_enabled == True
                ).first()

                if not camera:
                    return

                camera_id = camera.id


                # Generate a unique snapshot filename
                timestamp = datetime.now(timezone.utc)

                filename = (
                    f"camera_{camera_id}_"
                    f"{timestamp.strftime('%Y%m%d_%H%M%S')}_"
                    f"{uuid4().hex[:8]}.jpg"
                )

                image_path = EVENTS_DIR / filename

                # Save snapshot
                success = cv2.imwrite(
                    str(image_path),
                    frame
                )

                if not success:
                    raise RuntimeError("Failed to save motion snapshot")

                # Create database event
                event = MotionEvent(
                    camera_id=camera_id,
                    image_path=str(
                        image_path.relative_to(PROJECT_ROOT)
                    ),
                    description=f"Motion detected in {len(regions)} region(s)"
                )

                db.add(event)
                db.commit()

                self.last_event_time[device_index] = current_time

                print(
                    f"Motion event created: "
                    f"Camera {camera_id}, Event ID {event.id}"
                )

            except Exception as error:

                db.rollback()

                if image_path and image_path.exists():
                    image_path.unlink()

                print("Motion event error:", error)

            finally:
                db.close()
