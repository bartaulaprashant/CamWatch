
import cv2

# Initialize the webcam
camera = cv2.VideoCapture(0)

if not camera.isOpened():
    print("Error: Could not access the webcam.")
    exit()

print("Camera started. Press Q to exit.")

while True:
    # Capture one frame
    success, frame = camera.read()

    if not success:
        print("Error: Could not read camera frame.")
        break

    # Display the captured frame
    cv2.imshow("CamWatch - Live Camera", frame)

    # Exit when Q is pressed
    if cv2.waitKey(1) & 0xFF == ord("q"):
        break

# Release camera resources
camera.release()
cv2.destroyAllWindows()
