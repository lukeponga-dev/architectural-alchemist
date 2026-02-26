# 🧪 Architectural Alchemist (Devpost - Gemini Live Agent Edition)

**"Transform your world, but stay safe while doing it."**

Architectural Alchemist is a real-time, AI-powered spatial reasoning engine that turns your living room into a digital canvas. Built with **Gemini Live**, **WebRTC**, and **Google Cloud Vision**, it allows users to interactively analyze their surroundings and plan architectural transformations.

## 🚀 Vision

Most AI interior design tools work with static photos. Architectural Alchemist works with **live movement**. By establishing a bidirectional WebRTC bridge to Gemini 1.5 Pro, we've created an agent that can see what you see, hear your ideas, and identify architectural surfaces with pixel-perfect precision.

## 🛡️ Privacy as a Core Feature (AUP Compliance)

Built for the **AUP Compliance** challenge, this project features a strict **Privacy Shield** integrated directly into its backend.

- **Mandatory Privacy Gate Check**: No image is saved without undergoing server-side redaction.
- **Crowd Blocking**: Strict threshold. Images containing >3 faces are immediately rejected. No crowds are analyzed.
- **Server-Side Blurring**: Automatically detects 1-3 faces using Google Cloud Vision API and blurs the image _before_ it gets stored in the Cloud bucket.
- **Client-Side Muting/Halting**: The frontend regularly samples the feed (`/process-frame`) and halts sending the stream to the AI reasoning engine when people are detected (Safe Feed concept).
- **Secure Access**: The frontend retrieves temporary 15-minute Signed URLs. The internal bucket remains strictly private.

## 🏗️ Technical Stack

This project was intentionally partitioned to support static web exports and edge delivery.

### Frontend

- **Framework**: Next.js (React), Static HTML Export compatible.
- **Styling**: Tailwind CSS & Framer Motion.
- **Functionality**: Live Video Feed capture, WebRTC client management, and UI overlays.

### Backend (Python)

- **Framework**: FastAPI (runs on default port `8080`).
- **Live Engine**: Gemini Live (WebRTC Integration) using `aiortc`.
- **Spatial Reasoning**: Gemini 1.5 Pro via `google-generativeai` (`/spatial` endpoint).
- **Privacy Shield**: Standalone frame processing & snapshot saving with Google Cloud Vision.
- **Persistence**: Google Cloud Storage & Firestore.

## ✨ Key Features

1. **Interactive Spatial Inspection**: Click any surface in the live feed to get an AI breakdown of its material, color, and structural potential.
2. **Community Gallery**: Save your "inspections" to a persistent gallery stored in Firestore and access redacted images via Signed URLs.
3. **Omni-directional Audio**: Talk to the Alchemist as you move through your room via WebRTC.
4. **Premium Showcase**: A high-fidelity viewing experience for exploring architectural snapshots.

## 🛠️ Getting Started

### Prerequisites

- Node.js (v18+)
- Python (3.9+)
- Google Cloud Platform Project with billing enabled (Firestore, Cloud Storage, Vision API).
- Google Service Account Key JSON.

### Setup

1. **Clone the repository:**

   ```bash
   git clone <repo_url>
   cd architectural-alchemist
   ```

2. **Environment Variables:**
   Set the following variables in a `.env` file at the root:

   ```env
   # API Keys
   GEMINI_LIVE_API_KEY="..."
   GOOGLE_APPLICATION_CREDENTIALS="/absolute/path/to/your/key.json"
   GOOGLE_SERVICE_ACCOUNT_EMAIL="..."
   GCP_PROJECT_ID="..."

   # Storage
   SNAPSHOT_BUCKET="..."
   FIRESTORE_COLLECTION="architectural_snapshots"

   # Frontend Configuration
   NEXT_PUBLIC_BACKEND_URL="http://localhost:8080"
   NEXT_PUBLIC_FIREBASE_API_KEY="..."
   # (Include other NEXT_PUBLIC_FIREBASE_* variables)
   ```

3. **Backend Setup:**

   ```bash
   pip install fastapi uvicorn websockets aiortc av Pillow google-cloud-vision google-cloud-storage google-cloud-firestore google-generativeai
   ```

4. **Frontend Setup:**

   ```bash
   npm install
   ```

### Running Locally

You'll need two terminals.

**Terminal 1 (Backend - FastAPI)**

```bash
python main.py
```

**Terminal 2 (Frontend - Next.js)**

```bash
npm run dev
```

Browse to `http://localhost:3000`.

---

_Built for the Gemini Live Agent Hackathon._
