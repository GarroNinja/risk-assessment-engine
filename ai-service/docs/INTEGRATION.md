# Integration Guide

## Architecture Overview

```
Frontend (React/Vite)
    |
    | HTTP (JSON)
    v
AI Service (Flask, port 5000)
    |-- middleware: CORS, security validation, rate limiting
    |-- routes: 6 AI endpoints + /health
    |-- services: Categoriser, ReportGenerator
    |-- clients: GroqClient (retry + backoff)
    |-- cache: RedisCache / NullCache
    |
    | HTTPS
    v
Groq API (LLM inference)

Backend (Spring Boot, port 8080)
    |-- REST API: auth, risk records, audit logs
    |-- PostgreSQL (via Flyway migrations)
    |-- Redis (Spring Cache)
```

The AI service is stateless. All persistence is delegated to Redis (response cache) and the backend (risk records).

---

## Local Setup

### Prerequisites

- Python 3.12+
- Redis (optional; set `AI_CACHE_ENABLED=false` to skip)
- A Groq API key from [console.groq.com](https://console.groq.com)

### Steps

```bash
cd ai-service
python -m venv venv
source venv/bin/activate
pip install -r requirements-dev.txt
cp .env.example .env
# edit .env and set GROQ_API_KEY
python app.py
```

The service starts on `http://localhost:5000`.

### Run Tests

```bash
cd ai-service
pytest
```

Tests set `GROQ_API_KEY=test-key`, `AI_CACHE_ENABLED=false`, and `APP_ENV=test` automatically via the `conftest.py` autouse fixture. No real API calls are made; Groq is fully mocked.

---

## Docker

```bash
cd ai-service
docker build -t risk-ai-service .
docker run --rm \
  -e GROQ_API_KEY=your_key_here \
  -e AI_CACHE_ENABLED=false \
  -p 5000:5000 \
  risk-ai-service
```

With Redis:
```bash
docker run --rm \
  -e GROQ_API_KEY=your_key_here \
  -e REDIS_URL=redis://host.docker.internal:6379/0 \
  -p 5000:5000 \
  risk-ai-service
```

---

## Frontend to AI Endpoint Mapping

| Frontend Action | AI Endpoint | Notes |
|---|---|---|
| Categorise risk form submit | `POST /categorise` | Returns category, severity, confidence |
| Generate full report | `POST /generate-report` | Bulk risk list, audience selector |
| Stream report generation | `POST /generate-report/stream` | SSE; renders progressively |
| Describe / risk level check | `POST /describe` | Single text input, Low/Medium/High |
| Get remediation advice | `POST /recommend` | Returns 3-5 prioritised actions |
| Security Q&A chat | `POST /query` | Free-form question, text answer |
| Document / code scan | `POST /analyse-document` | Returns structured findings list |
| Service health check | `GET /health` | Used by load balancer / frontend startup |

---

## Security Fixes Applied

The following findings from the security audit have been addressed:

| Finding | Fix |
|---|---|
| F-004: Non-dict body not rejected | `security_middleware` checks `isinstance(data, dict)` before processing |
| F-005: No field size limit | `security_middleware` rejects any string field exceeding 50,000 bytes |
| F-006: SQL regex false positives | Removed SQL regex check entirely; legitimate prose with SQL words is no longer rejected |
| F-007: Prompt injection keyword blocking | Removed keyword blocklist; overly broad and blocks valid security-domain text |
| F-012: HTML stripping in middleware | Removed; sanitisation is the model's concern, not the transport layer |
| F-030: CORS wildcard in production | `CORS_ORIGINS` env var controls allowed origins; defaults to `*` for local dev only |
| Secrets in application.yml | `MAIL_USERNAME`, `MAIL_PASSWORD`, and `JWT_SECRET` defaults are now empty strings; no test credentials committed |
