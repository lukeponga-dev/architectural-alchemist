"""WebRTC and media stream handling."""

import asyncio
import base64
import io
import json
import websockets
from aiortc import RTCPeerConnection, RTCSessionDescription
from aiortc.contrib.media import MediaStreamTrack
from av import AudioFrame

from config import settings
from services.privacy_shield import PrivacyShield


class AudioStreamTrack(MediaStreamTrack):
    """Audio stream track for Gemini's voice output."""
    
    kind = "audio"

    def __init__(self):
        super().__init__()
        self.queue = asyncio.Queue()

    async def recv(self):
        data = await self.queue.get()
        frame = AudioFrame(format="s16", layout="mono", samples=len(data) // 2)
        frame.planes[0].update(data)
        frame.sample_rate = settings.AUDIO_SAMPLE_RATE
        return frame


class VideoReceiverTrack(MediaStreamTrack):
    """Video receiver track with privacy protection."""
    
    kind = "video"

    def __init__(self, track, privacy_shield: PrivacyShield):
        super().__init__()
        self.track = track
        self.queue = asyncio.Queue()
        self.privacy_shield = privacy_shield
        asyncio.create_task(self._run_loop())

    async def _run_loop(self):
        """Process video frames with privacy protection."""
        while True:
            try:
                frame = await self.track.recv()
                img = frame.to_image()
                
                # Apply privacy shield
                processed_img = await self.privacy_shield.process_image(img)
                
                # Encode and queue for Gemini
                buf = io.BytesIO()
                processed_img.save(buf, format="JPEG", quality=70)
                await self.queue.put(base64.b64encode(buf.getvalue()).decode("utf-8"))
                await asyncio.sleep(1.0 / settings.VIDEO_FPS)
            except:
                break


class WebRTCManager:
    """Manages WebRTC connections and media bridging."""
    
    def __init__(self, privacy_shield: PrivacyShield):
        self.privacy_shield = privacy_shield

    async def create_peer_connection(self, params: dict) -> dict:
        """Create WebRTC peer connection and return answer."""
        pc = RTCPeerConnection()

        # Track for Gemini's voice
        gemini_voice = AudioStreamTrack()
        pc.addTrack(gemini_voice)

        audio_recv = None
        video_recv = None

        @pc.event
        async def on_track(track):
            nonlocal audio_recv, video_recv
            if track.kind == "audio":
                audio_recv = track
            elif track.kind == "video":
                video_recv = VideoReceiverTrack(track, self.privacy_shield)
                # Start bridge when we have video
                asyncio.create_task(
                    self._bridge_to_gemini(audio_recv, gemini_voice, video_recv)
                )

        await pc.setRemoteDescription(
            RTCSessionDescription(sdp=params["sdp"], type=params["type"])
        )
        answer = await pc.createAnswer()
        await pc.setLocalDescription(answer)
        return {"sdp": pc.localDescription.sdp, "type": pc.localDescription.type}

    async def _bridge_to_gemini(self, audio_source, audio_sink, video_source):
        """Bridge media streams to Gemini Live API."""
        url = f"wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key={settings.GEMINI_KEY}"

        async with websockets.connect(url) as ws:
            # Initial Handshake
            await ws.send(
                json.dumps({"setup": {"model": settings.GEMINI_MODEL}})
            )

            async def send_media():
                """Send video frames to Gemini."""
                while True:
                    try:
                        video_frame = await asyncio.wait_for(
                            video_source.queue.get(), timeout=settings.FRAME_TIMEOUT_SECONDS
                        )
                        await ws.send(
                            json.dumps(
                                {
                                    "realtime_input": {
                                        "media_chunks": [
                                            {"mime_type": "image/jpeg", "data": video_frame}
                                        ]
                                    }
                                }
                            )
                        )
                    except asyncio.TimeoutError:
                        pass

            async def receive_gemini():
                """Receive audio from Gemini."""
                async for msg in ws:
                    data = json.loads(msg)
                    if "serverContent" in data:
                        audio_b64 = (
                            data["serverContent"]
                            .get("modelDraft", {})
                            .get("inlineData", {})
                            .get("data")
                        )
                        if audio_b64:
                            await audio_sink.queue.put(base64.b64decode(audio_b64))

            await asyncio.gather(send_media(), receive_gemini())
