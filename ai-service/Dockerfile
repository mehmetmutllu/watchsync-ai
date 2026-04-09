FROM python:3.12-slim

WORKDIR /app

# System dependencies
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        libgl1 \
        libglib2.0-0 \
        curl \
        git \
    && rm -rf /var/lib/apt/lists/*

# Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir torch==2.7.0+cpu torchvision==0.22.0+cpu --index-url https://download.pytorch.org/whl/cpu && \
    pip install --no-cache-dir -r requirements.txt && \
    pip install --no-cache-dir sam2 || echo "SAM2 install skipped — fallback mode enabled"

# Application code
COPY . .

# Create necessary directories
RUN mkdir -p /app/models /app/uploads /app/outputs

EXPOSE 8001

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
