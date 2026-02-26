# Project Architectural Alchemist - Setup Guide

This guide provides detailed setup instructions for running the Project Architectural Alchemist application.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Frontend Setup](#frontend-setup)
3. [Backend Setup](#backend-setup)
4. [Firebase Configuration](#firebase-configuration)
5. [Google Cloud Setup](#google-cloud-setup)
6. [Running the Application](#running-the-application)
7. [Development Workflow](#development-workflow)

---

## Prerequisites

### System Requirements

- **Operating System**: Windows 10+, macOS 10.14+, or Linux (Ubuntu 18.04+)
- **Memory**: 8GB RAM minimum (16GB recommended)
- **Storage**: 10GB free space

### Required Software

| Software | Version | Installation |
|----------|---------|--------------|
| Node.js | 18+ | [nodejs.org](https://nodejs.org) |
| Python | 3.12 | [python.org](https://python.org) |
| Git | 2.30+ | [git-scm.com](https://git-scm.com) |
| FFmpeg | Latest | [ffmpeg.org](https://ffmpeg.org) |

### Browser Requirements

- Chrome 90+ (recommended)
- Firefox 88+
- Safari 14+
- Edge 90+

---

## Frontend Setup

### Step 1: Install Node.js Dependencies

```
bash
# Navigate to project directory
cd "Project Architectural Alchemist"

# Clean install dependencies
rm -rf node_modules package-lock.json
npm install
```

### Step 2: Configure Environment Variables

Create a `.env.local` file in the root directory:

```
env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# Development Options
NEXT_PUBLIC_USE_FIREBASE_EMULATOR=false
```

### Step 3: Verify Frontend Setup

```
bash
# Run the development server
npm run dev

# Open browser to http://localhost:3000
```

---

## Backend Setup

### Step 1: Python Environment Setup

#### Windows

```
powershell
# Create virtual environment
python -m venv venv

# Activate virtual environment
venv\Scripts\activate
```

#### macOS / Linux

```
bash
# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate
```

### Step 2: Install Python Dependencies

```
bash
# Upgrade pip
pip install --upgrade pip

# Install dependencies
pip install -r requirements.txt
```

### Step 3: Configure Backend Environment

Create a `.env` file in the root directory:

```
env
# Gemini Live API - Required for real-time AI
# Get your API key from: https://aistudio.google.com/app/apikey
GEMINI_LIVE_API_KEY=your_gemini_api_key_here

# Google Cloud - Required for Vision API
GOOGLE_APPLICATION_CREDENTIALS=./path/to/your/service-account.json
```

### Step 4: Verify Backend Setup

```
bash
# Run the backend server
python main.py

# The server should start on http://localhost:8000
```

---

## Firebase Configuration

### Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Click "Add project" and follow the setup wizard
3. Enable Google Analytics (optional)

### Step 2: Enable Authentication

1. In Firebase Console, go to **Authentication** → **Sign-in method**
2. Enable **Anonymous** provider
3. Click Save

### Step 3: Enable Firestore Database

1. Go to **Firestore Database** → **Create database**
2. Start in **Test mode** (or configure security rules)
3. Select your region

### Step 4: Get Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll to "Your apps" section
3. Click the web icon (</>)
4. Register app and copy the config object

---

## Google Cloud Setup

### Step 1: Create Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing

### Step 2: Enable APIs

Enable the following APIs:

- **Gemini API** (Generative Language API)
- **Cloud Vision API**
- **Firebase Extensions API** (if using Firebase Functions)

### Step 3: Get API Keys

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **API Key**
3. Copy and secure your API key
4. (Recommended) Restrict the key to specific APIs

### Step 4: Set Up Service Account (for Vision API)

1. Go to **IAM & Admin** → **Service Accounts**
2. Create a service account with **Cloud Vision API** role
3. Create and download JSON key file
4. Set `GOOGLE_APPLICATION_CREDENTIALS` to this file path

---

## Running the Application

### Development Mode

#### Terminal 1: Frontend

```
bash
npm run dev
```

#### Terminal 2: Backend

```
bash
python main.py
```

#### Access Points

- Frontend: <http://localhost:3000>
- Backend API: <http://localhost:8000>
- API Documentation: <http://localhost:8000/docs>
- WebSocket: ws://localhost:8000/ws

### Production Mode

#### Using Docker

```
bash
# Build image
docker build -t architectural-alchemist .

# Run container
docker run -p 8000:8000 -p 3000:3000 \
  -e GEMINI_LIVE_API_KEY=your_key \
  -v /path/to/credentials.json:/app/credentials.json \
  architectural-alchemist
```

#### Using Google App Engine

```
bash
# Deploy backend
gcloud app deploy app.yaml

# Deploy frontend (Firebase Hosting)
firebase deploy
```

---

## Development Workflow

### Running Tests

```
bash
# Frontend tests
npm test

# Linting
npm run lint
```

### Adding New Features

1. Create a feature branch: `git checkout -b feature/your-feature`
2. Make changes and commit: `git commit -m "Add your feature"`
3. Push to remote: `git push origin feature/your-feature`
4. Create pull request

### Code Style

- **Frontend**: ESLint + Prettier (configured in `eslint.config.mjs`)
- **Backend**: PEP 8 Python style guide
- **Commits**: Conventional Commits format

---

## Common Issues

### Camera/Microphone Permission Denied

- Ensure you're using HTTPS or localhost
- Check browser permissions
- Some browsers require explicit user gesture to access media

### CORS Errors

- The backend is configured to accept requests from localhost:3000
- If using different ports, update CORS settings in `main.py`

### WebRTC Connection Failed

- Check firewall settings
- Ensure STUN server (stun.l.google.com:19302) is accessible
- Try with a different network (some corporate networks block WebRTC)

### Gemini API Errors

- Verify API key is valid and has not expired
- Check API quotas in Google Cloud Console
- Ensure Generative Language API is enabled

---

## Next Steps

After setup, you can:

1. Explore the codebase in `components/` and `lib/`
2. Read the API documentation at <http://localhost:8000/docs>
3. Check out `docs/` folder for project planning documents
4. Start building new features!

---

*Last Updated: Project Setup Documentation*
