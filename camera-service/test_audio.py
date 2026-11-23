
import asyncio

from audio_manager import AudioManager


async def main():
    audio = AudioManager()

    try:
        audio.start()

        track = audio.get_track()

        print("Microphone initialized successfully.")
        print("Listening for audio samples...")

        for i in range(10):
            frame = await track.recv()

            print(
                f"Audio frame {i + 1}: "
                f"{frame.samples} samples, "
                f"{frame.sample_rate} Hz"
            )

        track.stop()

    finally:
        audio.stop()


asyncio.run(main())
