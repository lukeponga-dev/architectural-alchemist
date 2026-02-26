#!/bin/bash

# Google Cloud Run Deployment Script for Architectural Alchemist
# This script automates deployment to Google Cloud Run (Bonus Points)

set -e

# Configuration
PROJECT_ID=${GCP_PROJECT_ID:-"gemini-live-agent-devpost"}
REGION=${GCP_REGION:-"us-central1"}
SERVICE_NAME="architectural-alchemist-api"
REPO_NAME="architectural-alchemist"

echo "🚀 Deploying Architectural Alchemist to Google Cloud Run..."
echo "Project: $PROJECT_ID"
echo "Region: $REGION"
echo "Service: $SERVICE_NAME"

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo "❌ gcloud CLI not found. Please install Google Cloud SDK."
    exit 1
fi

# Set project
echo "📋 Setting project..."
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "🔧 Enabling required APIs..."
gcloud services enable run.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable vision.googleapis.com
gcloud services enable firestore.googleapis.com
gcloud services enable storage.googleapis.com

# Create Artifact Registry repository
echo "📦 Creating Artifact Registry repository..."
gcloud artifacts repositories create $REPO_NAME \
    --repository-format=docker \
    --location=$REGION \
    --description="Architectural Alchemist Docker images"

# Build and push Docker image
echo "🐳 Building Docker image..."
docker build -t $REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/$SERVICE_NAME:latest .

echo "📤 Pushing Docker image..."
docker push $REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/$SERVICE_NAME:latest

# Deploy to Cloud Run
echo "☁️ Deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --image=$REGION-docker.pkg.dev/$PROJECT_ID/$REPO_NAME/$SERVICE_NAME:latest \
    --region=$REGION \
    --platform=managed \
    --allow-unauthenticated \
    --memory=1Gi \
    --cpu=1 \
    --timeout=300 \
    --concurrency=10 \
    --min-instances=0 \
    --max-instances=10 \
    --set-env-vars=GCP_PROJECT_ID=$PROJECT_ID

# Get service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME \
    --region=$REGION \
    --format='value(status.url)')

echo "✅ Deployment complete!"
echo "🌐 Service URL: $SERVICE_URL"
echo "📊 Monitor: https://console.cloud.google.com/run/detail/$REGION/$SERVICE_NAME"

# Test deployment
echo "🧪 Testing deployment..."
curl -X GET "$SERVICE_URL/health" || echo "⚠️ Health check failed"

echo "🎉 Architectural Alchemist is now live on Google Cloud Run!"
