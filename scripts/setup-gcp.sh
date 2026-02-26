#!/bin/bash

# Architectural Alchemist - GCP Setup Script
# This script provisions the Google Cloud project and enables required APIs

set -e

PROJECT_NAME="architectural-alchemist"
PROJECT_ID="arch-alchemist-$(date +%s)"
REGION="us-central1"

echo "🏗️  Setting up Architectural Alchemist GCP Project..."

# Create new project
echo "Creating project: $PROJECT_ID"
gcloud projects create $PROJECT_ID --name="$PROJECT_NAME"

# Set active project
gcloud config set project $PROJECT_ID

# Enable required APIs
echo "📡 Enabling APIs..."
apis=(
    "aiplatform.googleapis.com"          # Vertex AI
    "generativelanguage.googleapis.com"   # Gemini Multimodal Live API
    "run.googleapis.com"                 # Cloud Run
    "vision.googleapis.com"               # Cloud Vision
    "firestore.googleapis.com"           # Firestore
    "firebase.googleapis.com"            # Firebase
    "cloudbuild.googleapis.com"           # Cloud Build
    "artifactregistry.googleapis.com"     # Artifact Registry
)

for api in "${apis[@]}"; do
    echo "  Enabling $api..."
    gcloud services enable $api --project=$PROJECT_ID
done

# Create service accounts
echo "🔐 Creating service accounts..."
gcloud iam service-accounts create "alchemist-runner" --display-name="Alchemist Runner"
gcloud iam service-accounts create "alchemist-vision" --display-name="Alchemist Vision Service"

# Grant permissions
echo "🔑 Granting permissions..."
PROJECT_NUMBER=$(gcloud projects describe $PROJECT_ID --format='value(projectNumber)')

# Cloud Run permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:alchemist-runner@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/run.admin"

gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:alchemist-runner@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/aiplatform.user"

# Vision API permissions
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member="serviceAccount:alchemist-vision@$PROJECT_ID.iam.gserviceaccount.com" \
    --role="roles/vision.imageAnnotator"

echo "✅ GCP Setup Complete!"
echo "Project ID: $PROJECT_ID"
echo "Region: $REGION"
