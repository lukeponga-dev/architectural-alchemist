# Terraform configuration for Architectural Alchemist infrastructure
# Infrastructure as Code for automated deployment (Bonus Points)

terraform {
  required_version = ">= 1.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.gcp_project_id
  region  = var.gcp_region
}

# Variables
variable "gcp_project_id" {
  description = "Google Cloud Project ID"
  type        = string
  default     = "gemini-live-agent-devpost"
}

variable "gcp_region" {
  description = "Google Cloud Region"
  type        = string
  default     = "us-central1"
}

variable "service_name" {
  description = "Cloud Run service name"
  type        = string
  default     = "architectural-alchemist-api"
}

# Enable required APIs
resource "google_project_service" "required_apis" {
  for_each = toset([
    "run.googleapis.com",
    "cloudbuild.googleapis.com",
    "vision.googleapis.com",
    "firestore.googleapis.com",
    "storage.googleapis.com",
    "artifactregistry.googleapis.com"
  ])
  
  project = var.gcp_project_id
  service = each.key
}

# Artifact Registry for Docker images
resource "google_artifact_registry_repository" "repo" {
  location      = var.gcp_region
  repository_id = "architectural-alchemist"
  description   = "Docker images for Architectural Alchemist"
  format        = "DOCKER"
}

# Cloud Storage bucket for snapshots
resource "google_storage_bucket" "snapshots" {
  name          = "${var.gcp_project_id}-snapshots"
  location      = var.gcp_region
  force_destroy = true
  
  uniform_bucket_level_access = true
  
  lifecycle_rule {
    condition {
      age = 30
    }
    action {
      type = "Delete"
    }
  }
}

# Firestore database
resource "google_firestore_database" "database" {
  project     = var.gcp_project_id
  name        = "(default)"
  location_id = var.gcp_region
  type        = "FIRESTORE_NATIVE"
}

# Cloud Run service
resource "google_cloud_run_v2_service" "default" {
  name     = var.service_name
  location = var.gcp_region
  project  = var.gcp_project_id

  template {
    containers {
      image = "us-docker.pkg.dev/${var.gcp_project_id}/architectural-alchemist/${var.service_name}:latest"
      
      env_vars {
        name  = "GCP_PROJECT_ID"
        value = var.gcp_project_id
      }
      
      env_vars {
        name  = "SNAPSHOT_BUCKET"
        value = google_storage_bucket.snapshots.name
      }
      
      resources {
        cpu = 1
        memory = "1Gi"
      }
    }
    
    max_instance_count = 10
    min_instance_count = 0
  }

  traffic {
    percent = 100
    latest_revision = true
  }
}

# IAM permissions
resource "google_cloud_run_v2_service_iam_member" "public" {
  location = google_cloud_run_v2_service.default.location
  project  = google_cloud_run_v2_service.default.project
  name     = google_cloud_run_v2_service.default.name
  role     = "roles/run.invoker"
  member   = "allUsers"
}

# Cloud Run service account
resource "google_service_account" "cloud_run" {
  account_id   = "architectural-alchemist-sa"
  display_name = "Architectural Alchemist Service Account"
}

# Service account permissions
resource "google_project_iam_member" "cloud_run_roles" {
  for_each = toset([
    "roles/storage.admin",
    "roles/firestore.admin",
    "roles/vision.imageAnnotator"
  ])
  
  project = var.gcp_project_id
  role    = each.key
  member  = "serviceAccount:${google_service_account.cloud_run.email}"
}

# Outputs
output "service_url" {
  description = "Cloud Run service URL"
  value       = google_cloud_run_v2_service.default.uri
}

output "bucket_name" {
  description = "Cloud Storage bucket name"
  value       = google_storage_bucket.snapshots.name
}

output "service_account_email" {
  description = "Service account email"
  value       = google_service_account.cloud_run.email
}
