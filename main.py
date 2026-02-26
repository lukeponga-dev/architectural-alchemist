from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, HTTPException
from fastapi.responses import HTMLResponse
from aiortc import RTCPeerConnection, RTCSessionDescription, RTCIceCandidate
from aiortc.contrib.media import MediaStreamTrack
import json
import logging
import numpy as np
import os
from av import AudioFrame
import asyncio
import websockets

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("fastapi_webrtc")

app = FastAPI()

pcs = set() # Store peer connections

class AudioReceiverTrack(MediaStreamTrack):
    """
    A custom MediaStreamTrack that receives audio frames and extracts raw data.
    """
    kind = "audio"

    def __init__(self, track):
        super().__init__()
        self.track = track  # The actual incoming MediaStreamTrack
        self.queue = asyncio.Queue()
        asyncio.create_task(self._run_loop())

    async def _run_loop(self):
        while True:
            try:
                frame: AudioFrame = await self.track.recv()
                # Convert the AudioFrame to a NumPy array
                # Gemini Live API expects raw, little-endian, 16-bit PCM audio at 16kHz
                # aiortc's default is usually 48kHz, so we might need resampling
                # For now, let's convert to s16 mono and assume 16kHz for simplicity.
                # Actual resampling will be handled in a later step if needed.
                raw_audio_data = frame.to_ndarray(format="s16", layout="mono")
                # Ensure it's 16-bit little-endian
                raw_audio_data = raw_audio_data.astype(np.int16).tobytes()
                await self.queue.put(raw_audio_data)
            except Exception as e:
                logger.error(f"Error in AudioReceiverTrack _run_loop: {e}")
                break

    async def recv_audio_data(self):
        return await self.queue.get()


class VideoReceiverTrack(MediaStreamTrack):
    """
    A custom MediaStreamTrack that receives video frames and extracts raw data.
    """
    kind = "video"

    def __init__(self, track):
        super().__init__()
        self.track = track  # The actual incoming MediaStreamTrack
        self.queue = asyncio.Queue()
        asyncio.create_task(self._run_loop())

    async def _run_loop(self):
        while True:
            try:
                frame = await self.track.recv()
                # Gemini Live API expects JPEG format at 1 FPS, recommended 768x768
                # For simplicity, we'll convert to JPEG and base64 encode.
                # Resizing to 768x768 will be added later if needed.
                
                # Convert PyAV VideoFrame to JPEG bytes
                # frame.to_image().save() requires a file-like object or a filename
                # To get bytes directly, we can use BytesIO
                import io
                from PIL import Image # Pillow library for image manipulation

                # Convert VideoFrame to PIL Image
                pil_image = frame.to_image()

                # Resize to 768x768 if not already
                if pil_image.width != 768 or pil_image.height != 768:
                    pil_image = pil_image.resize((768, 768), Image.LANCZOS) # High quality downsampling

                # Save as JPEG to BytesIO object
                byte_arr = io.BytesIO()
                pil_image.save(byte_arr, format='JPEG', quality=80) # Adjust quality as needed
                jpeg_bytes = byte_arr.getvalue()

                # Base64 encode
                import base64
                base64_encoded_jpeg = base64.b64encode(jpeg_bytes).decode('utf-8')
                
                await self.queue.put(base64_encoded_jpeg)

            except Exception as e:
                logger.error(f"Error in VideoReceiverTrack _run_loop: {e}")
                break

    async def recv_video_data(self):
        return await self.queue.get()

html = """
<!DOCTYPE html>
<html>
<head>
    <title>WebRTC-Gemini Live API</title>
    <style>
        body { font-family: sans-serif; margin: 20px; }
        video { width: 320px; height: 240px; border: 1px solid black; margin: 10px; }
        #log { border: 1px solid #ccc; padding: 10px; height: 200px; overflow-y: scroll; margin-top: 20px; }
    </style>
</head>
<body>
    <h1>WebRTC-Gemini Live API</h1>

    <video id="localVideo" autoplay muted></video>
    <video id="remoteVideo" autoplay></video>

    <div id="log"></div>

    <script>
        const localVideo = document.getElementById('localVideo');
        const remoteVideo = document.getElementById('remoteVideo');
        const logDiv = document.getElementById('log');
        let pc = null;
        let ws = null;

        function log(msg) {
            const p = document.createElement('p');
            p.textContent = msg;
            logDiv.appendChild(p);
            logDiv.scrollTop = logDiv.scrollHeight;
        }

        async function start() {
            log('Starting WebRTC connection...');

            ws = new WebSocket("ws://localhost:8000/ws");
            ws.onmessage = async (event) => {
                const message = JSON.parse(event.data);
                log('WebSocket message received: ' + event.data);

                if (message.type === 'answer') {
                    await pc.setRemoteDescription(message);
                } else if (message.type === 'candidate') {
                    await pc.addIceCandidate(message.candidate);
                }
            };
            ws.onopen = () => log('WebSocket connected.');
            ws.onclose = () => log('WebSocket disconnected.');
            ws.onerror = (error) => log('WebSocket error: ' + error);

            pc = new RTCPeerConnection({
                iceServers: [{
                    urls: 'stun:stun.l.google.com:19302'
                }]
            });

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    log('Sending ICE candidate.');
                    ws.send(JSON.stringify({ type: 'candidate', candidate: event.candidate }));
                }
            };

            pc.ontrack = (event) => {
                log('Remote track received.');
                if (event.track.kind === 'video') {
                    remoteVideo.srcObject = event.streams[0];
                }
            };

            const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            localVideo.srcObject = stream;
            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            log('Sending SDP offer to backend...');
            const response = await fetch('/webrtc', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ sdp: pc.localDescription.sdp, type: pc.localDescription.type })
            });
            const sdpAnswer = await response.json();
            log('Received SDP answer from backend.');
            await pc.setRemoteDescription(new RTCSessionDescription(sdpAnswer));
        }

        start();
    </script>
</body>
</html>
"""

@app.get("/")
async def get():
    return HTMLResponse(html)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    logger.info("WebSocket connected for signaling.")
    try:
        while True:
            message = await websocket.receive_text()
            data = json.loads(message)
            # This WebSocket is primarily for ICE candidates from client to server
            # and answers from server to client, after the initial offer.
            # aiortc handles the server-side signaling for SDP offers/answers internally
            # via the /webrtc endpoint.
            logger.info(f"Received signaling message: {data['type']}")
            for pc in pcs: # Assuming one PC for now, iterate if multiple
                if data["type"] == "candidate":
                    candidate = RTCIceCandidate(
                        sdpMid=data["candidate"]["sdpMid"],
                        sdpMLineIndex=data["candidate"]["sdpMLineIndex"],
                        candidate=data["candidate"]["candidate"],
                    )
                    await pc.addIceCandidate(candidate)
                elif data["type"] == "answer":
                    # This case should ideally not happen if /webrtc sends the answer
                    # directly. But kept for robustness.
                    await pc.setRemoteDescription(RTCSessionDescription(
                        sdp=data["sdp"], type=data["type"]
                    ))
                else:
                    logger.warning(f"Unknown message type: {data['type']}")
    except WebSocketDisconnect:
        logger.info("WebSocket disconnected.")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")

@app.post("/webrtc")
async def webrtc(request: Request):
    params = await request.json()
    offer = RTCSessionDescription(sdp=params["sdp"], type=params["type"])

    pc = RTCPeerConnection()
    pcs.add(pc)
    logger.info(f"Created new RTCPeerConnection, total: {len(pcs)}")

    # Store references to track processors for this peer connection
    audio_track_processor = None
    video_track_processor = None

    @pc.event
    async def on_iceconnectionstatechange():
        logger.info(f"ICE connection state is {pc.iceConnectionState}")
        if pc.iceConnectionState == "failed":
            await pc.close()
            pcs.discard(pc)

    @pc.event
    async def on_track(track):
        nonlocal audio_track_processor, video_track_processor
        logger.info(f"Track {track.kind} received")
        if track.kind == "audio":
            logger.info("Audio track received. Initializing AudioReceiverTrack.")
            audio_track_processor = AudioReceiverTrack(track)
            asyncio.create_task(process_audio_from_webrtc(audio_track_processor))
        elif track.kind == "video":
            logger.info("Video track received. Initializing VideoReceiverTrack.")
            video_track_processor = VideoReceiverTrack(track)
            asyncio.create_task(process_video_from_webrtc(video_track_processor))

        @track.event
        def on_ended():
            logger.info(f"Track {track.kind} ended")
            nonlocal audio_track_processor, video_track_processor
            if track.kind == "audio" and audio_track_processor:
                audio_track_processor = None
            elif track.kind == "video" and video_track_processor:
                video_track_processor = None

    async def process_audio_from_webrtc(audio_processor: AudioReceiverTrack):
        # Get API key from environment variables
        gemini_api_key = os.getenv("GEMINI_LIVE_API_KEY")
        if not gemini_api_key:
            logger.error("GEMINI_LIVE_API_KEY environment variable not set")
            return

        gemini_ws_url = f"wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key={gemini_api_key}"
        
        gemini_ws = None
        try:
            gemini_ws = await websockets.connect(gemini_ws_url)
            logger.info("Connected to Gemini Live API WebSocket.")

            # Send initial configuration message if required by Gemini Live API
            # (refer to Gemini Live API documentation for specific requirements)
            # Example (might need adjustment based on actual API):
            await gemini_ws.send(json.dumps({
                "configure": {
                    "audio": {
                        "encoding": "LINEAR16",
                        "sampleRateHertz": 16000,
                        "audioChannelCount": 1
                    },
                    "languageCode": "en-US"
                }
            }))

            while audio_processor == audio_track_processor: # Keep running while the same processor is active
                try:
                    raw_audio = await audio_processor.recv_audio_data()
                    # Here, 'raw_audio' is bytes of 16-bit little-endian PCM at 16kHz (assumed)
                    logger.debug(f"Received {len(raw_audio)} bytes of raw audio from WebRTC. Sending to Gemini Live API.")
                    
                    # Send audio data to Gemini Live API
                    await gemini_ws.send(raw_audio)

                    # Receive and log responses from Gemini Live API (non-blocking)
                    try:
                        gemini_response = await asyncio.wait_for(gemini_ws.recv(), timeout=0.1) # Small timeout
                        logger.info(f"Gemini Live API response: {gemini_response}")
                        # TODO: Process Gemini Live API response (e.g., send back to client)
                    except asyncio.TimeoutError:
                        pass # No response yet, continue sending audio
                    except Exception as e:
                        logger.error(f"Error receiving from Gemini Live API: {e}")

                except Exception as e:
                    logger.error(f"Error processing audio from WebRTC or sending to Gemini Live API: {e}")
                    break
        except Exception as e:
            logger.error(f"Failed to connect to Gemini Live API WebSocket: {e}")
        finally:
            if gemini_ws:
                await gemini_ws.close()
                logger.info("Disconnected from Gemini Live API WebSocket.")

    async def process_video_from_webrtc(video_processor: VideoReceiverTrack):
        # Get API key from environment variables
        gemini_api_key = os.getenv("GEMINI_LIVE_API_KEY")
        if not gemini_api_key:
            logger.error("GEMINI_LIVE_API_KEY environment variable not set")
            return

        gemini_ws_url = f"wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key={gemini_api_key}"
        
        gemini_ws = None
        try:
            gemini_ws = await websockets.connect(gemini_ws_url)
            logger.info("Connected to Gemini Live API WebSocket for video.")

            # Send initial configuration message if required by Gemini Live API
            # (refer to Gemini Live API documentation for specific requirements)
            # Example (might need adjustment based on actual API):
            await gemini_ws.send(json.dumps({
                "configure": {
                    "video": {
                        "encoding": "JPEG",
                        "frameRate": 1
                    },
                    "languageCode": "en-US" # Assuming language code is still relevant for video
                }
            }))

            while video_processor == video_track_processor: # Keep running while the same processor is active
                try:
                    base64_encoded_jpeg = await video_processor.recv_video_data()
                    logger.debug(f"Received {len(base64_encoded_jpeg)} bytes of Base64 encoded JPEG from WebRTC. Sending to Gemini Live API.")
                    
                    # Send video data to Gemini Live API
                    # The Gemini Live API expects Base64 encoded JPEG as part of a JSON message
                    await gemini_ws.send(json.dumps({
                        "image": {
                            "imageData": base64_encoded_jpeg
                        }
                    }))

                    # Receive and log responses from Gemini Live API (non-blocking)
                    try:
                        gemini_response = await asyncio.wait_for(gemini_ws.recv(), timeout=0.1) # Small timeout
                        logger.info(f"Gemini Live API video response: {gemini_response}")
                        # TODO: Process Gemini Live API response (e.g., send back to client)
                    except asyncio.TimeoutError:
                        pass # No response yet, continue sending video
                    except Exception as e:
                        logger.error(f"Error receiving from Gemini Live API for video: {e}")

                except Exception as e:
                    logger.error(f"Error processing video from WebRTC or sending to Gemini Live API: {e}")
                    break
        except Exception as e:
            logger.error(f"Failed to connect to Gemini Live API WebSocket for video: {e}")
        finally:
            if gemini_ws:
                await gemini_ws.close()
                logger.info("Disconnected from Gemini Live API WebSocket for video.")

    # set remote description and create answer
    await pc.setRemoteDescription(offer)
    answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)

    return {"sdp": pc.localDescription.sdp, "type": pc.localDescription.type}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

