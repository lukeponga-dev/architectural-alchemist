# 🏗️ Architectural Alchemist (Gemini Live Agent Challenge)

**"Transform your world, but stay safe while doing it."**

Architectural Alchemist is a next-generation AI agent that leverages **multimodal inputs and outputs** to move beyond simple text-in/text-out interactions. Built for the **Live Agents** category, it uses **Gemini Live API** with **ADK integration** to create real-time, interruption-aware architectural transformation experiences.

## 🎯 Competition Category: Live Agents 🗣️

**Focus**: Real-time Interaction (Audio/Vision) with Interruption Handling

Our agent allows users to **talk naturally** while it **sees their living space** through live video, providing instant architectural analysis and design suggestions. The agent handles **graceful interruptions** and maintains **conversation context** throughout the interaction.

## 🚀 What Makes This Next-Generation

### Beyond Text Box Paradigm
- **Live Video Analysis**: Real-time architectural surface identification
- **Natural Voice Interaction**: Talk to the agent as you move through your space
- **Seamless Interruptions**: Agent pauses and responds when you interrupt
- **Context-Aware Responses**: Remembers room layout and conversation history
- **Multimodal Output**: Combines spatial analysis with natural language

### Live & Context-Aware Experience
- **Real-time WebRTC bridge** to Gemini Live API
- **Bidirectional audio/video streaming** at 1 FPS with privacy protection
- **ADK-powered agent** with tool-based architecture
- **Conversation state management** with memory and context

## 🛡️ Privacy as a Core Feature (AUP Compliance)

Built for responsible AI deployment with strict **Privacy Shield** integration:

- **Mandatory Privacy Gate**: No image processed without server-side redaction
- **Crowd Blocking**: Images with >3 faces immediately rejected
- **Server-Side Blurring**: Automatic face detection and Gaussian blurring
- **Safe Feed Concept**: Frontend halts streaming when people detected
- **Secure Access**: 15-minute signed URLs, private storage buckets

## 🏗️ Technical Architecture

### Live Agent Stack
- **ADK Integration**: Agent Development Kit for enhanced capabilities
- **Gemini Live API**: Real-time multimodal interaction
- **WebRTC Bridge**: Low-latency audio/video streaming
- **Interruption Handler**: Graceful conversation management
- **Tool-Based Architecture**: Modular, extensible design

### Google Cloud Services
- **Gemini 1.5 Pro**: Spatial reasoning and analysis
- **Cloud Vision API**: Face detection and privacy protection
- **Cloud Run**: Serverless container hosting
- **Cloud Storage**: Secure image storage with signed URLs
- **Firestore**: Conversation and metadata persistence
- **Artifact Registry**: Container management

### Infrastructure as Code (Bonus Points)
- **Terraform**: Automated infrastructure provisioning
- **Cloud Build**: CI/CD pipeline
- **Deployment Scripts**: One-command deployment

## ✨ Key Features for Live Agents Category

1. **Natural Conversation**: Talk to the agent while moving through your space
2. **Real-time Vision**: Live architectural analysis via video stream
3. **Interruption Handling**: Agent pauses and responds to interruptions
4. **Context Memory**: Remembers room layout and conversation history
5. **Privacy Protection**: Built-in face detection and blurring
6. **Spatial Tools**: Click-to-analyze architectural surfaces
7. **Multimodal Output**: Combines visual analysis with voice responses

## 🎥 Demo Video Script (4 Minutes)

### Opening (0:30)
- Show problem: Static interior design tools lack real-time interaction
- Introduce Architectural Alchemist as solution
- Demonstrate live video feed setup

### Core Features (2:00)
- **Natural Interaction**: Talk to agent while walking around room
- **Spatial Analysis**: Click on wall/floor for instant analysis
- **Interruption Demo**: Interrupt agent mid-sentence, show graceful handling
- **Privacy Protection**: Show face detection and blurring in action

### Technical Innovation (1:00)
- Show ADK integration and tool architecture
- Demonstrate Gemini Live API real-time capabilities
- Highlight Cloud Run deployment and infrastructure

### Value Proposition (0:30)
- Problem solved: Real-time architectural guidance
- Unique value: Live interaction with privacy protection
- Call to action: Future of AI-assisted design

## 🛠️ Competition Submission Requirements

### ✅ Mandatory Technologies Used
- **✅ Gemini Model**: Gemini Live API + Gemini 1.5 Pro
- **✅ ADK Integration**: Agent Development Kit implementation
- **✅ Google Cloud Services**: Cloud Run, Storage, Firestore, Vision API

### 📋 Submission Checklist
- **✅ Text Description**: Comprehensive feature documentation
- **✅ Public Code Repository**: This repository with detailed README
- **✅ Cloud Deployment Proof**: Terraform + deployment scripts
- **✅ Architecture Diagram**: Detailed system architecture (Mermaid)
- **✅ Demo Video**: 4-minute demonstration script provided

### 🎁 Bonus Points Achieved
- **✅ Infrastructure as Code**: Terraform configuration included
- **✅ Deployment Automation**: Bash scripts for Cloud Run deployment
- **✅ Blog Content**: Technical documentation and architecture deep-dive

## �️ Getting Started (Competition Judges)

### Prerequisites
- **Node.js** (v18+) and **Python** (3.9+)
- **Google Cloud Platform** project with billing enabled
- **Google Service Account** with required permissions:
  - Cloud Run Admin
  - Storage Admin  
  - Firestore Admin
  - Vision Image Annotator
  - Artifact Registry Admin

### Quick Setup for Judges

1. **Clone repository:**
   ```bash
   git clone https://github.com/your-username/architectural-alchemist.git
   cd architectural-alchemist
   ```

2. **Backend setup:**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Frontend setup:**
   ```bash
   cd ../
   npm install
   ```

4. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your GCP credentials and API keys
   ```

5. **Run locally:**
   
   **Terminal 1 (Backend - FastAPI):**
   ```bash
   cd backend
   python main.py
   ```

   **Terminal 2 (Frontend - Next.js):**
   ```bash
   npm run dev
   ```

   Browse to `http://localhost:3000`

### One-Click Cloud Deployment (Bonus Points)

**Option 1: Automated Script**
```bash
# Deploy to Google Cloud Run
chmod +x deploy/cloud-run.sh
./deploy/cloud-run.sh
```

**Option 2: Terraform**
```bash
cd deploy/terraform
terraform init
terraform plan
terraform apply
```

### Environment Variables

Create `.env` file at project root:

```env
# API Keys
GEMINI_LIVE_API_KEY="your-gemini-live-api-key"
GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
GOOGLE_SERVICE_ACCOUNT_EMAIL="your-service-account@project.iam.gserviceaccount.com"
GCP_PROJECT_ID="your-gcp-project-id"

# Storage & Database
SNAPSHOT_BUCKET="your-project-snapshots"
FIRESTORE_COLLECTION="architectural_snapshots"

# Frontend Configuration
NEXT_PUBLIC_BACKEND_URL="https://your-service-url.run.app"
NEXT_PUBLIC_FIREBASE_API_KEY="your-firebase-api-key"
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-gcp-project-id"
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="your-project.appspot.com"
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="your-sender-id"
NEXT_PUBLIC_FIREBASE_APP_ID="your-app-id"
```

### Development Workflow

1. **Local Development**: Use `npm run dev` and `python main.py`
2. **Testing**: Visit `http://localhost:8080/health` for API status
3. **Deployment**: Use provided scripts for automated Cloud Run deployment
4. **Monitoring**: Check Google Cloud Console for logs and metrics

## 🏆 Competition Advantages

### Innovation & Multimodal UX (40%)
- **Breaks text box paradigm** with live video interaction
- **Seamless multimodal experience** combining vision, audio, and tools
- **Distinct agent persona** as architectural assistant
- **Live and context-aware** with conversation memory

### Technical Implementation (30%)
- **Effective ADK integration** with custom tools
- **Robust Cloud Run hosting** with auto-scaling
- **Sound agent logic** with error handling
- **Privacy grounding** and responsible AI practices

### Demo & Presentation (30%)
- **Clear problem-solution narrative** in demo script
- **Comprehensive architecture documentation**
- **Cloud deployment proof** with infrastructure as code
- **Working software demonstration** with real features

## 📊 Architecture Diagram

See [docs/architecture-diagram.md](docs/architecture-diagram.md) for detailed system architecture including:
- Real-time data flow diagrams
- ADK integration patterns
- Privacy protection mechanisms
- Infrastructure deployment architecture

## 🔗 Live Demo

- **Development**: `http://localhost:3000`
- **API Health**: `http://localhost:8080/health`
- **Cloud Run**: Deployed URL (after running deployment script)

---

**Built for Gemini Live Agent Challenge 2026**  
*Category: Live Agents - Real-time Interaction with Audio/Vision*

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
