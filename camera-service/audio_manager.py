import asyncio
import os
import platform
import shutil
import subprocess

import av
from aiortc import AudioStreamTrack
from aiortc.mediastreams import MediaStreamError
from aiortc.contrib.media import MediaRelay
from fractions import Fraction


class MicrophoneTrack(AudioStreamTrack):

    def __init__(self, process):
        super().__init__()
        self.process = process
        self.sample_rate = 48000
        self.samples_per_frame = 960
        self.bytes_per_frame = self.samples_per_frame * 2 * 2
        self.pts = 0

    def _read_exact(self):
        data = bytearray()

        while len(data) < self.bytes_per_frame:
            chunk = self.process.stdout.read(
                self.bytes_per_frame - len(data)
            )

            if not chunk:
                break

            data.extend(chunk)

        return bytes(data)

    async def recv(self):
        loop = asyncio.get_running_loop()

        raw_data = await loop.run_in_executor(
            None,
            self._read_exact
        )

        if len(raw_data) != self.bytes_per_frame:
            raise MediaStreamError

        frame = av.AudioFrame(
            format="s16",
            layout="stereo",
            samples=self.samples_per_frame
        )

        frame.planes[0].update(raw_data)
        frame.sample_rate = self.sample_rate
        frame.pts = self.pts
        frame.time_base = Fraction(1, self.sample_rate)

        self.pts += self.samples_per_frame

        return frame


class AudioManager:

    def __init__(self):
        self.process = None
        self.track = None
        self.relay = MediaRelay()
        self.running = False

    def _build_ffmpeg_command(self):
        if not shutil.which("ffmpeg"):
            raise RuntimeError("FFmpeg is not installed or is not available on PATH")

        backend = os.getenv("CAMWATCH_AUDIO_BACKEND", "auto").lower()
        device = os.getenv("CAMWATCH_AUDIO_DEVICE", "default")

        if backend == "auto":
            if shutil.which("pactl") or shutil.which("pw-cli"):
                # pactl = PulseAudio, pw-cli = PipeWire (which provides
                # PulseAudio-compatible capture via pipewire-pulse)
                backend = "pulse"
            elif platform.system() == "Darwin":
                backend = "avfoundation"
            else:
                backend = "dshow"

        if backend == "pulse":
            input_format = ["-f", "pulse", "-i", device]
        elif backend == "avfoundation":
            input_format = ["-f", "avfoundation", "-i", device]
        elif backend == "dshow":
            input_format = ["-f", "dshow", "-i", f"audio={device}"]
        else:
            raise RuntimeError(f"Unsupported CAMWATCH_AUDIO_BACKEND: {backend}")

        return [
            "ffmpeg",
            *input_format,
            "-ac", "2",
            "-ar", "48000",
            "-f", "s16le",
            "-acodec", "pcm_s16le",
            "pipe:1"
        ]

    def start(self):
        if self.running:
            return

        try:
            self.process = subprocess.Popen(
                self._build_ffmpeg_command(),
                stdout=subprocess.PIPE,
                stderr=subprocess.DEVNULL,
                bufsize=0
            )
        except (OSError, RuntimeError) as error:
            self.running = False
            raise RuntimeError(f"Could not start microphone audio: {error}")

        if self.process.poll() is not None:
            self.process = None
            raise RuntimeError("Microphone capture process exited immediately")

        self.track = MicrophoneTrack(self.process)
        self.running = True

        print("Microphone audio service started.")

    def get_track(self):
        if not self.running:
            raise RuntimeError("Audio service is not running")

        return self.relay.subscribe(self.track)

    def stop(self):
        if not self.running:
            return

        if self.track:
            self.track.stop()

        if self.process:
            self.process.terminate()
            try:
                self.process.wait(timeout=3)
            except subprocess.TimeoutExpired:
                self.process.kill()
                self.process.wait()

        self.process = None
        self.track = None
        self.running = False

        print("Microphone audio service stopped.")
