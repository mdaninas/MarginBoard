# syntax=docker/dockerfile:1.7

# ---- Builder ----------------------------------------------------------------
FROM python:3.13-slim AS builder

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /build

# Build deps for any wheel that still ships sdist.
RUN apt-get update \
 && apt-get install -y --no-install-recommends build-essential \
 && rm -rf /var/lib/apt/lists/*

COPY requirements.txt ./
RUN python -m venv /opt/venv \
 && /opt/venv/bin/pip install --upgrade pip \
 && /opt/venv/bin/pip install -r requirements.txt

# ---- Runtime ---------------------------------------------------------------
FROM python:3.13-slim AS runtime

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PATH="/opt/venv/bin:$PATH"

# Non-root user — drop privileges in production.
RUN useradd --create-home --shell /bin/bash app

WORKDIR /app

COPY --from=builder /opt/venv /opt/venv
COPY --chown=app:app app /app/app
COPY --chown=app:app ml /app/ml
COPY --chown=app:app scripts /app/scripts

# Ensure the data dirs exist even when no volume is mounted yet.
RUN mkdir -p /app/data/raw /app/data/processed /app/data/sample \
 && chown -R app:app /app/data

USER app

EXPOSE 8000

# uvicorn binds to 0.0.0.0 so the container is reachable from the host.
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
