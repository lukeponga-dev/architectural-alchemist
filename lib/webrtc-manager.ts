/**
 * WebRTC Manager - Client for Architectural Alchemist Backend
 * Handles signaling and media streaming to the Cloud Run gateway.
 */

export class WebRTCManager {
  private peerConnection: RTCPeerConnection | null = null;
  private backendUrl: string;
  private ws: WebSocket | null = null;
  private onRemoteTrack?: (stream: MediaStream) => void;

  constructor(
    backendUrl: string,
    onRemoteTrack?: (stream: MediaStream) => void,
  ) {
    this.backendUrl = backendUrl.replace(/\/$/, ""); // Strip trailing slash
    this.onRemoteTrack = onRemoteTrack;
  }

  /**
   * Initialize WebRTC Connection
   */
  async connect(localStream: MediaStream, maxRetries = 5): Promise<void> {
    let attempt = 0;
    let baseDelay = 1000;

    while (attempt < maxRetries) {
      try {
        console.log(`Connecting to backend WebRTC gateway... (Attempt ${attempt + 1})`);

        // 1. Initialize PeerConnection
        this.peerConnection = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
        });

        // 2. Add local tracks
        localStream.getTracks().forEach((track) => {
          this.peerConnection?.addTrack(track, localStream);
        });

        // 3. Handle remote tracks (Gemini's audio/video)
        this.peerConnection.ontrack = (event) => {
          if (this.onRemoteTrack && event.streams[0]) {
            this.onRemoteTrack(event.streams[0]);
          }
        };

        // 4. Setup WebSocket for ICE signaling
        const wsUrl =
          this.backendUrl
            .replace("https://", "wss://")
            .replace("http://", "ws://") + "/ws";
        this.ws = new WebSocket(wsUrl);

        this.ws.onmessage = async (event) => {
          const message = JSON.parse(event.data);
          if (message.type === "candidate" && this.peerConnection) {
            await this.peerConnection.addIceCandidate(message.candidate);
          }
        };

        // 5. Create Offer and send to /webrtc endpoint
        const offer = await this.peerConnection.createOffer();
        await this.peerConnection.setLocalDescription(offer);

        const response = await fetch(`${this.backendUrl}/webrtc`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sdp: this.peerConnection.localDescription?.sdp,
            type: this.peerConnection.localDescription?.type,
          }),
        });

        if (!response.ok) {
          throw new Error(`Backend signaling failed: ${response.statusText}`);
        }

        const answer = await response.json();
        await this.peerConnection.setRemoteDescription(
          new RTCSessionDescription(answer),
        );

        // 6. Send local ICE candidates through WebSocket
        this.peerConnection.onicecandidate = (event) => {
          if (event.candidate && this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(
              JSON.stringify({ type: "candidate", candidate: event.candidate }),
            );
          }
        };

        console.log("WebRTC Loop Established.");
        return; // Success, exit loop
      } catch (error) {
        console.error(`WebRTC connection failed on attempt ${attempt + 1}:`, error);
        attempt++;
        if (attempt >= maxRetries) {
          throw new Error("Max retries reached. Could not establish WebRTC connection.");
        }
        const delay = baseDelay * Math.pow(2, attempt - 1);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        this.disconnect(); // Clean up before retrying
      }
    }
  }

  async disconnect() {
    this.ws?.close();
    this.peerConnection?.close();
  }
}

export default WebRTCManager;
