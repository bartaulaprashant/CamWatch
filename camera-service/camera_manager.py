
import cv2
import threading
import time

from motion_detector import MotionDetector
from event_manager import EventManager

class CameraManager:

    def __init__(self, camera_index=0):
        self.camera_index = camera_index

        self.camera = None
        self.latest_frame = None

        self.lock = threading.Lock()
        self.stop_event = threading.Event()
        self.capture_thread = None

        self.running = False
        self.last_error = None
        self.frame_count = 0
        
        self.motion_detector = MotionDetector(min_area=1500)

        self.motion_detected = False
        self.motion_regions = []
        
        self.event_manager = EventManager(cooldown=30)

    def start(self):
        if self.running:
            return

        self.camera = cv2.VideoCapture(self.camera_index)

        if not self.camera.isOpened():
            self.last_error = "Could not access webcam"
            self.camera.release()
            self.camera = None
            raise RuntimeError(self.last_error)

        self.stop_event.clear()
        self.running = True
        self.last_error = None

        self.capture_thread = threading.Thread(
            target=self._capture_loop,
            daemon=True
        )

        self.capture_thread.start()

        print("Camera service started.")

    def _capture_loop(self):

        while not self.stop_event.is_set():

            success, frame = self.camera.read()

            if not success:
                self.last_error = "Failed to capture frame"
                time.sleep(0.1)
                continue

            # Run motion detection
            motion_result = self.motion_detector.detect(frame)
            
            if motion_result["motion_detected"]:
                print(f"[MOTION] Detected {len(motion_result['regions'])} region(s)")

                self.event_manager.process_motion(
                    device_index=self.camera_index,
                    frame=frame,
                    regions=motion_result["regions"]
                )

            with self.lock:
                self.latest_frame = frame
                self.frame_count += 1
                self.last_error = None

                self.motion_detected = motion_result["motion_detected"]
                self.motion_regions = motion_result["regions"]

        print("Camera capture thread stopped.")

    def get_frame(self):

        with self.lock:
            if self.latest_frame is None:
                return None

            return self.latest_frame.copy()

    def get_status(self):

        return {
            "running": self.running,
            "frame_count": self.frame_count,
            "last_error": self.last_error,
            "has_frame": self.latest_frame is not None,
            "motion_detected": self.motion_detected,
            "motion_regions": self.motion_regions
        }

    def stop(self):

        if not self.running:
            return

        self.stop_event.set()

        if self.capture_thread:
            self.capture_thread.join(timeout=3)

        if self.camera:
            self.camera.release()
            self.camera = None

        self.running = False
        self.latest_frame = None

        print("Camera service stopped.")
