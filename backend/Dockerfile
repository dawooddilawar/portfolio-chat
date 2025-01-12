# /backend/Dockerfile
FROM python:3.10-slim

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    postgresql-client \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Add a startup script
COPY start.sh .
RUN chmod +x start.sh

# Set Python path
ENV PYTHONPATH=/app

# Run the application
CMD ["./start.sh"]