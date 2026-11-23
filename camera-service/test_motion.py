
import cv2

from motion_detector import MotionDetector


camera = cv2.VideoCapture(0)
detector = MotionDetector(min_area=1500)

while True:

    success, frame = camera.read()

    if not success:
        break

    result = detector.detect(frame)

    # Draw detected motion regions
    for region in result["regions"]:

        x = region["x"]
        y = region["y"]
        w = region["width"]
        h = region["height"]

        cv2.rectangle(
            frame,
            (x, y),
            (x + w, y + h),
            (0, 255, 0),
            2
        )

    status = (
        "MOTION DETECTED"
        if result["motion_detected"]
        else "No Motion"
    )

    cv2.putText(
        frame,
        status,
        (20, 40),
        cv2.FONT_HERSHEY_SIMPLEX,
        1,
        (0, 0, 255),
        2
    )

    cv2.imshow("CamWatch Motion Detection", frame)

    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

camera.release()
cv2.destroyAllWindows()
