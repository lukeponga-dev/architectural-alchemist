"""WebRTC API routes."""

from fastapi import APIRouter, Request
from services.webrtc import WebRTCManager
from services.privacy_shield import PrivacyShield

router = APIRouter(prefix="/webrtc", tags=["webrtc"])

# Initialize services
privacy_shield = PrivacyShield()
webrtc_manager = WebRTCManager(privacy_shield)


@router.post("")
async def webrtc_offer(request: Request):
    """Handle WebRTC offer and return answer."""
    params = await request.json()
    return await webrtc_manager.create_peer_connection(params)
