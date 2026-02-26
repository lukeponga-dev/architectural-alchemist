from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Request, HTTPException
from fastapi.responses import HTMLResponse
from fastapi.middleware.cors import CORSMiddleware
from aiortc import RTCPeerConnection, RTCSessionDescription, RTCIceCandidate
from aiortc.contrib.media import MediaStreamTrack
import json
import logging
import numpy as np
import os
import re
import uuid
from datetime import timedelta
from av import AudioFrame
import asyncio
import websockets
import base64
import google.genai as genai
import io
from PIL import Image, ImageFilter
import google.cloud.vision as vision
from google.cloud import storage
from google.cloud import firestore
from dotenv import load_dotenv

# Load .env file (must be before any os.getenv calls)
load_dotenv()


# Environment Configuration
GEMINI_KEY = os.getenv("GEMINI_LIVE_API_KEY")
PROJECT_ID = os.getenv("GCP_PROJECT_ID", "gemini-live-agent-devpost")

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("architectural_alchemist")

app = FastAPI()
app.add_middleware(
    CORSMiddleware, allow_origins=["*"], allow_methods=["*"], allow_headers=["*"]
)

# Lazy-initialized GCP clients (avoids crashing at startup if credentials are missing)
_storage_client = None
_firestore_client = None
_vision_client = None
_spatial_model = None

SNAPSHOT_BUCKET = os.getenv("SNAPSHOT_BUCKET", "incoming_photos")
COLLECTION = os.getenv("FIRESTORE_COLLECTION", "architectural_snapshots")


def get_storage_client():
    global _storage_client
    if _storage_client is None:
        _storage_client = storage.Client(project=PROJECT_ID)
    return _storage_client


def get_firestore_client():
    global _firestore_client
    if _firestore_client is None:
        _firestore_client = firestore.Client(project=PROJECT_ID)
    return _firestore_client


def get_vision_client():
    global _vision_client
    if _vision_client is None:
        _vision_client = vision.ImageAnnotatorClient()
    return _vision_client


def get_spatial_model():
    global _spatial_model
    if _spatial_model is None:
        client = genai.Client(api_key=GEMINI_KEY)
        _spatial_model = client
    return _spatial_model


class AudioStreamTrack(MediaStreamTrack):
    kind = "audio"

    def __init__(self):
        super().__init__()
        self.queue = asyncio.Queue()

    async def recv(self):
        data = await self.queue.get()
        frame = AudioFrame(format="s16", layout="mono", samples=len(data) // 2)
        frame.planes[0].update(data)
        frame.sample_rate = 16000
        return frame


class VideoReceiverTrack(MediaStreamTrack):
    kind = "video"

    def __init__(self, track):
        super().__init__()
        self.track = track
        self.queue = asyncio.Queue()
        asyncio.create_task(self._run_loop())

    async def _run_loop(self):
        while True:
            try:
                frame = await self.track.recv()
                img = frame.to_image()
                # Server-Side Privacy Shield
                # 1. Detect faces
                img_byte_arr = io.BytesIO()
                img.save(img_byte_arr, format="JPEG")
                vision_image = vision.Image(content=img_byte_arr.getvalue())

                # Check for humans/faces
                response = get_vision_client().face_detection(image=vision_image)
                if response.face_annotations:
                    # Blur detected face areas or the whole image for safety
                    img = img.filter(ImageFilter.GaussianBlur(15))

                # Final output to Gemini (1 FPS)
                buf = io.BytesIO()
                img.save(buf, format="JPEG", quality=70)
                await self.queue.put(base64.b64encode(buf.getvalue()).decode("utf-8"))
                await asyncio.sleep(1.0)
            except:
                break


@app.post("/webrtc")
async def webrtc_offer(request: Request):
    params = await request.json()
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
            video_recv = VideoReceiverTrack(track)
            # Start bridge when we have video
            asyncio.create_task(bridge_to_gemini(audio_recv, gemini_voice, video_recv))

    await pc.setRemoteDescription(
        RTCSessionDescription(sdp=params["sdp"], type=params["type"])
    )
    answer = await pc.createAnswer()
    await pc.setLocalDescription(answer)
    return {"sdp": pc.localDescription.sdp, "type": pc.localDescription.type}


async def bridge_to_gemini(audio_source, audio_sink, video_source):
    url = f"wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key={GEMINI_KEY}"

    async with websockets.connect(url) as ws:
        # Initial Handshake
        await ws.send(
            json.dumps({"setup": {"model": "models/gemini-1.5-flash-8b-exp-0827"}})
        )

        async def send_media():
            while True:
                # Prioritize Audio for low latency
                # In a real app, you'd pull from both queues efficiently
                try:
                    video_frame = await asyncio.wait_for(
                        video_source.queue.get(), timeout=0.5
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


@app.post("/snapshot")
async def save_snapshot(request: Request):
    body = await request.json()
    image_b64 = body.get("image")
    app_id = body.get("app_id", "default_app_id")
    user_id = body.get("user_id", "anonymous_user")
    is_public = body.get("is_public", False)

    if not image_b64:
        raise HTTPException(status_code=400, detail="Missing image data")

    # Decode image
    try:
        image_bytes = base64.b64decode(image_b64)
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image format")

    # ---- Privacy Shield Enforcement ----
    vision_image = vision.Image(content=image_bytes)
    response = get_vision_client().face_detection(image=vision_image)

    face_count = len(response.face_annotations)

    # 🚫 Block crowd scenes entirely
    if face_count > 3:
        raise HTTPException(
            status_code=403,
            detail="Too many people detected — snapshot blocked for privacy.",
        )

    # Blur if any faces detected
    if face_count > 0:
        image = image.filter(ImageFilter.GaussianBlur(15))

    # ---- Compress Image ----
    buffer = io.BytesIO()
    image.save(buffer, format="JPEG", quality=80)
    buffer.seek(0)

    snapshot_id = str(uuid.uuid4())
    blob_name = f"snapshots/{snapshot_id}.jpg"

    bucket = get_storage_client().bucket(SNAPSHOT_BUCKET)
    blob = bucket.blob(blob_name)

    blob.upload_from_file(buffer, content_type="image/jpeg")

    # ---- Signed URL (Cloud Run Safe) ----
    signed_url = blob.generate_signed_url(
        version="v4",
        expiration=timedelta(minutes=15),
        method="GET",
        service_account_email=os.getenv("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
    )

    # ---- Firestore Metadata ----
    snapshot_data = {
        "snapshot_id": snapshot_id,
        "storage_path": blob_name,
        "face_count": face_count,
        "created_at": firestore.SERVER_TIMESTAMP,
        "is_public": is_public,
    }

    firestore_client = get_firestore_client()
    # 1. Private Data Storage Path
    private_ref = (
        firestore_client.collection("artifacts")
        .document(app_id)
        .collection("users")
        .document(user_id)
        .collection("designs")
        .document(snapshot_id)
    )
    private_ref.set(snapshot_data)

    # 2. Public Gallery Storage Path
    if is_public:
        public_ref = (
            firestore_client.collection("artifacts")
            .document(app_id)
            .collection("public")
            .document("data")
            .collection("showcase")
            .document(snapshot_id)
        )
        public_ref.set(snapshot_data)

    return {
        "snapshot_id": snapshot_id,
        "signed_url": signed_url,
        "face_count": face_count,
    }


@app.get("/gallery")
async def get_gallery(app_id: str = "default_app_id", limit: int = 20):
    """Retrieves the latest architectural transformations."""
    firestore_client = get_firestore_client()
    snapshots_ref = (
        firestore_client.collection("artifacts")
        .document(app_id)
        .collection("public")
        .document("data")
        .collection("showcase")
    )
    # Using simple collection call without complex queries to avoid index requirements
    query = snapshots_ref.limit(limit)
    docs = query.stream()

    gallery = []
    bucket = get_storage_client().bucket(SNAPSHOT_BUCKET)

    for doc in docs:
        data = doc.to_dict()
        blob = bucket.blob(data["storage_path"])

        # Fresh signed URL for the gallery view
        signed_url = blob.generate_signed_url(
            version="v4",
            expiration=timedelta(minutes=15),
            method="GET",
            service_account_email=os.getenv("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
        )

        gallery.append(
            {
                "snapshot_id": data["snapshot_id"],
                "url": signed_url,
                "created_at": data["created_at"],
                "face_count": data.get("face_count", 0),
            }
        )

    return gallery


@app.get("/snapshot/{snapshot_id}/refresh")
async def refresh_signed_url(snapshot_id: str):
    """Generates a fresh signed URL for a specific snapshot."""
    doc_ref = get_firestore_client().collection(COLLECTION).document(snapshot_id)
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="Snapshot not found")

    data = doc.to_dict()
    bucket = get_storage_client().bucket(SNAPSHOT_BUCKET)
    blob = bucket.blob(data["storage_path"])

    signed_url = blob.generate_signed_url(
        version="v4",
        expiration=timedelta(minutes=15),
        method="GET",
        service_account_email=os.getenv("GOOGLE_SERVICE_ACCOUNT_EMAIL"),
    )

    return {"signed_url": signed_url}


@app.post("/spatial")
async def spatial_analysis(request: Request):
    """
    Handles architectural spatial reasoning using Gemini Pro.
    Supports 'analyze_room' and 'identify_surface'.
    """
    body = await request.json()
    image_b64 = body.get("image")
    analysis_type = body.get("type")

    if not image_b64:
        raise HTTPException(status_code=400, detail="Missing image data")

    # Strip base64 header if present
    if "," in image_b64:
        image_b64 = image_b64.split(",")[1]

    try:
        # Prepare image for Gemini
        image_content = {"mime_type": "image/jpeg", "data": image_b64}

        if analysis_type == "analyze_room":
            prompt = """
                Analyze this room image for architectural transformation.
                Identify the following structural elements:
                1. Walls (main structural surfaces)
                2. Floor and ceiling
                3. Windows and doors
                
                For each element, provide:
                - Bounding box in [ymin, xmin, ymax, xmax] format (normalized 0-1000)
                - Surface type
                - Material (e.g., concrete, wood, plaster)
                - Estimated confidence (0-1)
                
                Also estimate:
                - Room dimensions (width, height, depth in meters)
                - Camera position relative to the center of the room
                - Lighting quality (natural, artificial)
                
                Return ONLY a JSON object.
            """
        elif analysis_type == "identify_surface":
            x = body.get("x")
            y = body.get("y")
            width = body.get("width", 1280)
            height = body.get("height", 720)

            if x is None or y is None:
                raise HTTPException(
                    status_code=400, detail="Coordinates (x, y) are required"
                )

            # Convert pixel coordinates to normalized 0-1000 for Gemini
            norm_x = int((x / width) * 1000)
            norm_y = int((y / height) * 1000)

            prompt = f"""
                Identify the architectural surface at normalized coordinate [{norm_y}, {norm_x}].
                The image represents a room. Is this a wall, floor, ceiling, window, or door?
                
                Provide:
                1. The exact bounding box of the entire surface I am pointing at in [ymin, xmin, ymax, xmax] format.
                2. Its material and color.
                3. Why you believe this is the surface at that point.
                
                Return ONLY a JSON object with keys: "surface" (object with type, material, color, boundingBox), "confidence" (number), "reasoning" (string).
            """
        else:
            raise HTTPException(status_code=400, detail="Invalid analysis type")

        response = get_spatial_model().models.generate_content(
            model="gemini-2.0-flash", contents=[prompt, image_content]
        )
        text = response.text

        # Extract JSON from response
        match = re.search(r"\{[\s\S]*\}", text)
        if not match:
            raise Exception("No JSON found in AI response")

        return json.loads(match.group())

    except Exception as e:
        logger.error(f"Spatial analysis failed: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Spatial analysis failed: {str(e)}"
        )


@app.post("/process-frame")
async def process_frame(request: Request):
    """
    Stand-alone privacy shield for frontend frame checking.
    Returns blurred image if faces detected, or safe status.
    """
    body = await request.json()
    image_b64 = body.get("image_data")

    if not image_b64:
        raise HTTPException(status_code=400, detail="Missing image data")

    try:
        image_bytes = base64.b64decode(image_b64)
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        vision_image = vision.Image(content=image_bytes)
        response = get_vision_client().face_detection(image=vision_image)

        blur_applied = False
        processed_b64 = image_b64

        if response.face_annotations:
            blur_applied = True
            image = image.filter(ImageFilter.GaussianBlur(15))

            # Encode back to base64
            buf = io.BytesIO()
            image.save(buf, format="JPEG", quality=70)
            processed_b64 = base64.b64encode(buf.getvalue()).decode("utf-8")

        return {
            "blur_applied": blur_applied,
            "processed_image": processed_b64,
            "face_count": len(response.face_annotations),
        }

    except Exception as e:
        logger.error(f"Frame processing failed: {str(e)}")
        raise HTTPException(
            status_code=500, detail=f"Frame processing failed: {str(e)}"
        )


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8080)
