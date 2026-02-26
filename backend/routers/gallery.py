"""Gallery API routes."""

from datetime import timedelta
from fastapi import APIRouter

from config import settings
from services.gcp_clients import gcp_clients

router = APIRouter(prefix="/gallery", tags=["gallery"])


@router.get("")
async def get_gallery(app_id: str = settings.DEFAULT_APP_ID, limit: int = 20):
    """Retrieve the latest architectural transformations."""
    firestore_client = gcp_clients.get_firestore_client()
    snapshots_ref = (
        firestore_client.collection("artifacts")
        .document(app_id)
        .collection("public")
        .document("data")
        .collection("showcase")
    )
    
    query = snapshots_ref.limit(limit)
    docs = query.stream()

    gallery = []
    bucket = gcp_clients.get_storage_client().bucket(settings.SNAPSHOT_BUCKET)

    for doc in docs:
        data = doc.to_dict()
        blob = bucket.blob(data["storage_path"])

        # Fresh signed URL for gallery view
        signed_url = blob.generate_signed_url(
            version="v4",
            expiration=timedelta(minutes=settings.SIGNED_URL_EXPIRATION_MINUTES),
            method="GET",
            service_account_email=settings.GOOGLE_SERVICE_ACCOUNT_EMAIL,
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
