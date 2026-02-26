# Project Architectural Alchemist - Usage Guide

This guide explains how to use the Project Architectural Alchemist application.

## Table of Contents

1. [Application Overview](#application-overview)
2. [User Interface](#user-interface)
3. [Features](#features)
4. [API Reference](#api-reference)
5. [Architecture](#architecture)

---

## Application Overview

Project Architectural Alchemist is a real-time AI-powered application that combines:

- **Next.js Frontend**: React-based UI with video feed and agent panel
- **FastAPI Backend**: WebRTC signaling server with Gemini Live API integration
- **Firebase**: Authentication and backend services
- **Real-time AI**: Gemini Live API for audio/video AI interactions

---

## User Interface

### Main Page Components

#### 1. Authentication Status

- Displays "Signed in anonymously" with user UID
- Automatic anonymous sign-in on page load

#### 2. Video Feed

- Real-time camera display
- Shows local video stream
- Auto-connects to WebRTC for remote processing

#### 3. Agent Panel

- Displays agent status messages
- Visual feedback on AI processing states
- States: IDLE, LISTENING, ANALYZING_SPACE, GENERATING_PREVIEW

#### 4. Safety Filter

- Vertex AI Vision powered pre-filter
- Automatically pauses video processing when person detected
- Shows warning message: "⚠️ Person detected — video processing paused."

---

## Features

### 1. Anonymous Authentication

The app automatically signs users in anonymously using Firebase Authentication.

**Flow:**

1. Page loads → `signInAnonymously()` called
2. Auth state listener set up
3. User UID displayed on screen

### 2. Video Feed

Accesses user's webcam and microphone for real-time processing.

**Flow:**

1. User grants camera/microphone permissions
2. Video stream displayed in component
3. Frame capture callback triggered on loaded data
4. Stream ready for WebRTC transmission

### 3. WebRTC Communication

Real-time peer-to-peer media streaming between client and server.

**Connection Flow:**

1. Client creates RTCPeerConnection
2. Media tracks added to connection
3. SDP offer sent to server (/webrtc endpoint)
4. Server creates answer and returns
5. ICE candidates exchanged via WebSocket
6. Media streams established

### 4. Gemini Live API Integration

Real-time AI processing of audio and video streams.

**Audio Processing:**

- Format16, : LINEAR16kHz, mono
- Sent to Gemini Live API WebSocket
- Bidirectional communication enabled

**Video Processing:**

- Format: JPEG, 1 FPS, 768x768
- Frames converted and base64 encoded
- Sent to Gemini Live API for analysis

### 5. Agent State Management

ADK (Agent Development Kit) manages agent state transitions.

**State Transitions:**

```
IDLE → LISTENING → ANALYZING_SPACE → GENERATING_PREVIEW → IDLE
```

**State Descriptions:**

- **IDLE**: Agent waiting for input
- **LISTENING**: Agent actively listening to user
- **ANALYZING_SPACE**: Agent processing visual/audio data
- **GENERATING_PREVIEW**: Agent generating response/preview

---

## API Reference

### Frontend API Endpoints

#### GET `/`

- Description: Main application page
- Returns: Next.js React application

#### WebSocket `/ws`

- Description: WebRTC signaling and ICE candidate exchange
- Protocol: JSON messages

**Client → Server Messages:**

```
json
{ "type": "candidate", "candidate": { ... } }
{ "type": "answer", "sdp": "...", "type": "answer" }
```

#### POST `/webrtc`

- Description: WebRTC SDP offer/answer exchange
- Request Body:

```
json
{
  "sdp": "...",
  "type": "offer" | "answer"
}
```

- Response:

```
json
{
  "sdp": "...",
  "type": "offer" | "answer"
}
```

### Firebase Services

#### Authentication

- Provider: Anonymous
- Usage: `signInAnonymously(auth)`
- Listener: `onAuthStateChanged(auth, callback)`

#### Firestore (not actively used in current version)

- Could be extended for user data persistence

#### Cloud Functions (not actively used in current version)

- Could be extended for server-side processing

---

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (Browser)                         │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐│
│  │  Next.js    │  │   React     │  │    WebRTC (Native)      ││
│  │  Frontend   │←→│  Components │←→│    MediaStream          ││
│  └─────────────┘  └─────────────┘  └─────────────────────────┘│
│         ↓                                      ↓               │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Firebase SDK (Auth, Firestore)              │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
         ↓ HTTPS/WSS
┌─────────────────────────────────────────────────────────────────┐
│                        SERVER (Backend)                         │
│  ┌──────────────────┐  ┌────────────────────────────────────┐  │
│  │  FastAPI Server  │  │       WebRTC (aiortc)              │  │
│  │  (Uvicorn)       │←→│  - RTCPeerConnection               │  │
│  │  - /webrtc       │  │  - AudioReceiverTrack              │  │
│  │  - /ws           │  │  - VideoReceiverTrack              │  │
│  └──────────────────┘  └────────────────────────────────────┘  │
│         ↓                                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Gemini Live API (WebSocket)                 │  │
│  │  - Audio streaming (16kHz LINEAR16)                      │  │
│  │  - Video streaming (1 FPS JPEG 768x768)                  │  │
│  └──────────────────────────────────────────────────────────┘  │
│         ↓                                                      │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Google Cloud Vision API                      │  │
│  │  - Frame analysis                                         │  │
│  │  - Person detection                                       │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Component Hierarchy

```
pages/
└── _app.tsx (Firebase provider wrapper)
    └── index.tsx (Home page)
        ├── VideoFeed.tsx (MediaStream handler)
        │   └── navigator.mediaDevices.getUserMedia()
        └── AgentPanel.tsx (Agent status display)
            └── ADK (Agent state management)
```

### Data Flow

```
User Media (Camera/Mic)
    ↓
VideoFeed Component
    ↓
WebRTC RTCPeerConnection
    ↓
FastAPI /webrtc Endpoint
    ↓
aiortc MediaStreamTrack
    ↓
Gemini Live API (WebSocket)
    ↓
AI Response
```

---

## Troubleshooting Guide

### Issue: "Signing in..." never completes

- Check Firebase configuration in `.env.local`
- Verify network connectivity
- Check browser console for errors

### Issue: Camera not displaying

- Grant camera/microphone permissions
- Check if another app is using the camera
- Try a different browser

### Issue: WebRTC connection failed

- Check if backend server is running (port 8000)
- Verify firewall settings
- Ensure STUN server is accessible

### Issue: No Gemini AI response

- Verify `GEMINI_LIVE_API_KEY` is set in backend `.env`
- Check API key has correct permissions
- Verify API quota not exceeded

---

## Development Tips

### Adding New Components

1. Create component in `components/` directory
2. Import in `pages/index.tsx`
3. Style with Tailwind CSS classes

### Modifying Agent Behavior

1. Edit `lib/adk.ts` for state management
2. Modify `components/AgentPanel.tsx` for UI updates
3. Update `main.py` for backend processing logic

### Debugging WebRTC

1. Open Chrome://webrtc-internals
2. Check connection state
3. Monitor ICE candidate exchange

---

## Security Considerations

- API keys stored in environment variables (never committed)
- Firebase authentication uses anonymous sign-in
- WebRTC uses STUN servers for NAT traversal
- Consider enabling HTTPS for production

---

*Last Updated: Usage Documentation*
