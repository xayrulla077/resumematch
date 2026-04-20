FROM python:3.10-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    DEBIAN_FRONTEND=noninteractive

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    tesseract-ocr \
    poppler-utils \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Build context is repo root, so we need to reference backend/
COPY backend/requirements.txt ./requirements.txt
RUN pip install --no-cache-dir --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

COPY backend/ .

EXPOSE 8000

CMD gunicorn -k uvicorn.workers.UvicornWorker -w 1 -b 0.0.0.0:$PORT main:app