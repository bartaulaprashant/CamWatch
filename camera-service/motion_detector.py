
import cv2


class MotionDetector:

    def __init__(
        self,
        min_area=1500,
        history=500,
        variance_threshold=25
    ):
        self.min_area = min_area

        self.background_subtractor = cv2.createBackgroundSubtractorMOG2(
            history=history,
            varThreshold=variance_threshold,
            detectShadows=True
        )

    def detect(self, frame):

        # Apply background subtraction
        mask = self.background_subtractor.apply(frame)

        # Remove shadows (MOG2 marks shadows as 127)
        _, mask = cv2.threshold(
            mask,
            200,
            255,
            cv2.THRESH_BINARY
        )

        # Remove small noise
        kernel = cv2.getStructuringElement(
            cv2.MORPH_ELLIPSE,
            (3, 3)
        )

        mask = cv2.morphologyEx(
            mask,
            cv2.MORPH_OPEN,
            kernel
        )

        # Find moving regions
        contours, _ = cv2.findContours(
            mask,
            cv2.RETR_EXTERNAL,
            cv2.CHAIN_APPROX_SIMPLE
        )

        motion_detected = False
        motion_regions = []

        for contour in contours:

            area = cv2.contourArea(contour)

            if area < self.min_area:
                continue

            x, y, w, h = cv2.boundingRect(contour)

            motion_detected = True

            motion_regions.append({
                "x": x,
                "y": y,
                "width": w,
                "height": h,
                "area": area
            })

        return {
            "motion_detected": motion_detected,
            "regions": motion_regions,
            "mask": mask
        }
