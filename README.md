# Project Architectural Alchemist

A real-time AI-powered application that combines Next.js, Firebase, FastAPI, WebRTC, and Gemini Live API to create an intelligent agent with video and audio processing capabilities.

## 🚀 Tech Stack

### Frontend

- **Framework**: Next.js 16 (React 19)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **Backend Services**: Firebase (Auth, Firestore, Functions)
- **UI Components**: Custom React components

### Backend

- **Framework**: FastAPI (Python 3.12)
- **WebRTC**: aiortc
- **Media Processing**: PyAV, Pillow, NumPy
- **Real-time**: WebSockets
- **Deployment**: Google App Engine, Docker

### AI Integration

- **Gemini Live API**: Real-time audio/video AI interactions
- **Google Cloud Vision**: Image analysis

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

### Common Requirements

- Node.js 18+ and npm
- Python 3.12+
- Git

### For Frontend Development

- Firebase project with authentication enabled
- Google Cloud project with necessary APIs

### For Backend Development

- Python virtual environment (venv)
- FFmpeg (for media processing)

---

## 🛠️ Project Structure

```
Project Architectural Alchemist/
├── components/              # React components
│   ├── AgentPanel.tsx      # Agent UI panel
│   └── VideoFeed.tsx       # Video feed component
├── firebase/               # Firebase configuration files
├── lib/                    # Utility libraries
│   ├── adk.ts             # Agent Development Kit
│   ├── firebase.ts       # Firebase initialization
│   └── vertexVision.ts   # Google Vision API integration
├── pages/                  # Next.js pages
│   ├── _app.tsx          # App wrapper
│   └── index.tsx         # Main page
├── styles/                 # CSS styles
├── docs/                   # Project documentation
├── main.py                # FastAPI backend (WebRTC + Gemini)
├── requirements.txt       # Python dependencies
├── package.json          # Node.js dependencies
├── firebase.json         # Firebase configuration
├── app.yaml              # Google App Engine config
├── Dockerfile            # Docker configuration
└── README.md             # This file
```

---

## ⚡ Quick Start

### 1. Clone the Repository

```
bash
git clone <repository-url>
cd "Project Architectural Alchemist"
```

### 2. Frontend Setup

#### Install Dependencies

```
bash
npm install
```

#### Configure Environment Variables

Create a `.env.local` file in the root directory:

```
env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Optional: Use Firebase Emulators
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false
```

#### Run Development Server

```
bash
npm run dev
```

The frontend will be available at [http://localhost:3000](http://localhost:3000)

### 3. Backend Setup

#### Create Virtual Environment

```
bash
# Create virtual environment
python -m venv venv

# Activate on Windows
venv\Scripts\activate

# Activate on macOS/Linux
source venv/bin/activate
```

#### Install Dependencies

```
bash
pip install -r requirements.txt
```

#### Configure Environment Variables

Create a `.env` file in the root directory:

```
env
# Gemini Live API Key (REQUIRED for real-time AI)
GEMINI_LIVE_API_KEY=your_gemini_api_key

# Google Cloud Credentials (for Vision API)
GOOGLE_APPLICATION_CREDENTIALS=path/to/your/credentials.json
```

#### Run the Backend Server

```
bash
# Using uvicorn directly
uvicorn main:app --host 0.0.0.0 --port 8000

# Or using the Python script
python main.py
```

The backend will be available at [http://localhost:8000](http://localhost:8000)

---

## 🔧 Running the Full Stack

### Option 1: Run Both Separately

1. Start the frontend: `npm run dev` (port 3000)
2. Start the backend: `python main.py` (port 8000)

### Option 2: Using Docker

```
bash
# Build the Docker image
docker build -t architectural-alchemist .

# Run the container
docker run -p 8000:8000 -p 3000:3000 architectural-alchemist
```

### Option 3: Google App Engine Deployment

```
bash
# Deploy to Google App Engine
gcloud app deploy
```

---

## 📱 Features

### Current Features

1. **Anonymous Authentication**
   - Firebase anonymous sign-in
   - User session management

2. **Video Feed**
   - Real-time camera access
   - WebRTC stream handling
   - Frame capture for analysis

3. **Agent Panel**
   - Real-time agent status display
   - State management (IDLE, LISTENING, ANALYZING_SPACE, GENERATING_PREVIEW)

4. **WebRTC Integration**
   - Peer-to-peer media streaming
   - Audio/video track processing
   - ICE candidate handling

5. **Gemini Live API Integration**
   - Real-time audio streaming (16kHz, LINEAR16)
   - Real-time video streaming (JPEG, 1 FPS, 768x768)
   - Bidirectional communication

6. **Safety Filter**
   - Vertex AI Vision pre-filter
   - Person detection to pause processing

### Upcoming Features

- Real Gemini Live API response handling
- Multi-user support
- Advanced agent state management
- Enhanced video analysis

---

## 🔐 Environment Variables Reference

### Frontend (.env.local)

| Variable | Description | Required |
|----------|-------------|----------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Firebase API Key | Yes |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain | Yes |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Firebase Project ID | Yes |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket | Yes |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID | Yes |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | Firebase App ID | Yes |
| `NEXT_PUBLIC_USE_FIREBASE_EMULATOR` | Use Firebase Emulators | No |

### Backend (.env)

| Variable | Description | Required |
|----------|-------------|----------|
| `GEMINI_LIVE_API_KEY` | Gemini Live API Key | Yes |
| `GOOGLE_APPLICATION_CREDENTIALS` | GCP Service Account JSON | No |

---

## 🐛 Troubleshooting

### Frontend Issues

**Firebase Connection Failed**

- Ensure your Firebase config is correct in `.env.local`
- Check that authentication is enabled in Firebase Console

**Video Not Loading**

- Grant camera/microphone permissions in browser
- Ensure you're using HTTPS or localhost

### Backend Issues

**Port Already in Use**

- Change the port: `uvicorn main:app --port 8001`

**Module Not Found**

- Ensure virtual environment is activated
- Run `pip install -r requirements.txt` again

**WebRTC Connection Issues**

- Check firewall settings
- Ensure STUN server is accessible (stun.l.google.com:19302)

---

## 📄 License

This project is for educational and development purposes.

---

## 🤝 Contributing

1. Fork the repository
2. Create3. Make your a feature branch
 changes
3. Submit a pull request

---

## 📞 Support

For issues and questions, please open a GitHub issue.

---

*Generated on: Project Architectural Alchemist - Onboarding Documentation*
