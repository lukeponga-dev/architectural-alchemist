"""Snapshot management API routes."""

import base64
import io
import uuid
from datetime import timedelta
from fastapi import APIRouter, Request, HTTPException
from PIL import Image

from config import settings
from services.gcp_clients import gcp_clients
from services.privacy_shield import PrivacyShield

router = APIRouter(prefix="/snapshot", tags=["snapshot"])

# Initialize services
privacy_shield = PrivacyShield()


@router.post("")
async def save_snapshot(request: Request):
    """Save a snapshot with privacy protection."""
    body = await request.json()
    image_b64 = body.get("image")
    app_id = body.get("app_id", settings.DEFAULT_APP_ID)
    user_id = body.get("user_id", settings.DEFAULT_USER_ID)
    is_public = body.get("is_public", False)

    if not image_b64:
        raise HTTPException(status_code=400, detail="Missing image data")

    try:
        # Process image with privacy shield
        image, face_count = await privacy_shield.process_base64_image(image_b64)
        
        # Compress image
        buffer = io.BytesIO()
        image.save(buffer, format="JPEG", quality=settings.IMAGE_QUALITY)
        buffer.seek(0)

        snapshot_id = str(uuid.uuid4())
        blob_name = f"snapshots/{snapshot_id}.jpg"

        # Upload to storage
        bucket = gcp_clients.get_storage_client().bucket(settings.SNAPSHOT_BUCKET)
        blob = bucket.blob(blob_name)
        blob.upload_from_file(buffer, content_type="image/jpeg")

        # Generate signed URL
        signed_url = blob.generate_signed_url(
            version="v4",
            expiration=timedelta(minutes=settings.SIGNED_URL_EXPIRATION_MINUTES),
            method="GET",
            service_account_email=settings.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        )

        # Store metadata in Firestore
        snapshot_data = {
            "snapshot_id": snapshot_id,
            "storage_path": blob_name,
            "face_count": face_count,
            "created_at": gcp_clients.get_firestore_client().SERVER_TIMESTAMP,
            "is_public": is_public,
        }

        firestore_client = gcp_clients.get_firestore_client()
        
        # Private data storage
        private_ref = (
            firestore_client.collection("artifacts")
            .document(app_id)
            .collection("users")
            .document(user_id)
            .collection("designs")
            .document(snapshot_id)
        )
        private_ref.set(snapshot_data)

        # Public gallery storage
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

    except ValueError as e:
        raise HTTPException(status_code=403, detail=str(e))
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid image format")


@router.get("/{snapshot_id}/refresh")
async def refresh_signed_url(snapshot_id: str):
    """Generate a fresh signed URL for a specific snapshot."""
    doc_ref = gcp_clients.get_firestore_client().collection(settings.FIRESTORE_COLLECTION).document(snapshot_id)
    doc = doc_ref.get()

    if not doc.exists:
        raise HTTPException(status_code=404, detail="Snapshot not found")

    data = doc.to_dict()
    bucket = gcp_clients.get_storage_client().bucket(settings.SNAPSHOT_BUCKET)
    blob = bucket.blob(data["storage_path"])

    signed_url = blob.generate_signed_url(
        version="v4",
        expiration=timedelta(minutes=settings.SIGNED_URL_EXPIRATION_MINUTES),
        method="GET",
        service_account_email=settings.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    )

    return {"signed_url": signed_url}
