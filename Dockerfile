# Use Python 3.11 runtime
FROM python:3.11-slim

# Install system dependencies required for aiortc and pylibsrtp
RUN apt-get update && apt-get install -y \
    libsrtp2-dev \
    libopus-dev \
    libvpx-dev \
    pkg-config \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy requirements first for better caching
COPY requirements.txt .

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY backend/ ./backend/

# Use Google Cloud's built-in authentication in production

# Expose port
EXPOSE 8080

# Run the application with gunicorn
CMD ["sh", "-c", "cd backend && PYTHONPATH=. python -m gunicorn -k uvicorn.workers.UvicornWorker -b 0.0.0.0:8080 main:app"]
