
import asyncio

from aiortc import VideoStreamTrack
from av import VideoFrame


class CameraVideoTrack(VideoStreamTrack):

    def __init__(self, camera_manager):
        super().__init__()
        self.camera_manager = camera_manager

    async def recv(self):

        # Maintain WebRTC's video timing
        pts, time_base = await self.next_timestamp()

        # Get the latest frame from our camera service
        frame = self.camera_manager.get_frame()

        while frame is None:
            await asyncio.sleep(0.01)
            frame = self.camera_manager.get_frame()

        # Convert OpenCV frame into a WebRTC video frame
        video_frame = VideoFrame.from_ndarray(
            frame,
            format="bgr24"
        )

        video_frame.pts = pts
        video_frame.time_base = time_base

        return video_frame
