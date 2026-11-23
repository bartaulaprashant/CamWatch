
import cv2
import time

from camera_manager import CameraManager


camera = CameraManager()

try:
    camera.start()

    while True:

        frame = camera.get_frame()

        if frame is not None:
            cv2.imshow("CamWatch - Camera Service", frame)

        status = camera.get_status()

        print(
            f"\rFrames captured: {status['frame_count']} | "
            f"Running: {status['running']} | "
            f"Error: {status['last_error']}",
            end=""
        )

        if cv2.waitKey(1) & 0xFF == ord("q"):
            break

        time.sleep(0.01)

except KeyboardInterrupt:
    print("\nInterrupted by user.")

except Exception as error:
    print(f"\nError: {error}")

finally:
    camera.stop()
    cv2.destroyAllWindows()
    print("\nTest completed.")
