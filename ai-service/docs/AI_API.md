# AI Service API Reference

Base URL: `http://localhost:5000` (or `AI_SERVICE_URL` in the frontend config)

All endpoints accept and return `application/json`. POST endpoints require a JSON object body.

---

## Endpoints

### POST /categorise

Classify a security risk into an OWASP Top 10 (2021) category.

**Request**
```json
{
  "title": "SQL login bypass",
  "description": "User input is appended directly to the SQL query without sanitisation.",
  "context": "Optional additional context string"
}
```

**Response 200**
```json
{
  "category": "INJECTION",
  "severity": "HIGH",
  "confidence": 0.97,
  "rationale": "Direct string concatenation into SQL is a textbook injection vector.",
  "tags": ["sql-injection", "input-validation"]
}
```

On model failure the response includes `"degraded": true` and uses keyword-based fallback logic.

**Rate limit:** 30 requests / 60 s per IP.

---

### POST /generate-report

Generate a full Markdown or summary risk report from a list of risks.

**Request**
```json
{
  "risks": [
    {
      "title": "SQL Injection",
      "description": "Unsanitised query parameters.",
      "category": "INJECTION",
      "severity": "HIGH"
    }
  ],
  "audience": "engineer",
  "format": "markdown",
  "project_name": "MyApp"
}
```

- `audience`: `engineer` | `manager` | `executive`
- `format`: `markdown` | `summary`
- Maximum 100 risks per request.

**Response 200**
```json
{
  "content": "## Overview\n...",
  "audience": "engineer",
  "format": "markdown",
  "risk_count": 1,
  "metadata": {"model": "llama-3.1-70b-versatile", "usage": {}}
}
```

On model failure the response includes `"degraded": true` and uses a deterministic fallback sorted by severity.

**Rate limit:** 10 requests / 60 s per IP.

---

### POST /generate-report/stream

Same as `/generate-report` but returns a Server-Sent Events stream.

**Response** (`text/event-stream`)
```
data: {"delta": "## Overview\n"}

data: {"delta": "This report covers..."}

data: [DONE]
```

On error, an `event: error` frame is sent followed by the fallback report content, then `[DONE]`.

**Rate limit:** shared with `/generate-report` (10 / 60 s).

---

### POST /describe

Classify the risk level of a text description and identify the affected component.

**Request**
```json
{"text": "The login endpoint does not enforce account lockout after failed attempts."}
```

Also accepts nested form: `{"input": {"text": "..."}}`.

**Response 200**
```json
{
  "risk_level": "High",
  "reasoning": "No lockout allows brute-force credential stuffing attacks.",
  "affected_component": "Authentication endpoint"
}
```

**Rate limit:** 20 requests / 60 s per IP.

---

### POST /recommend

Generate prioritised remediation recommendations for a described risk.

**Request**
```json
{"text": "JWT tokens are signed with a hardcoded secret stored in source code."}
```

**Response 200**
```json
{
  "recommendations": [
    {
      "priority": "High",
      "title": "Rotate the signing secret immediately",
      "description": "Generate a cryptographically random 256-bit secret and store it in a secrets manager."
    }
  ]
}
```

Returns 3-5 recommendations ordered by priority.

**Rate limit:** 20 requests / 60 s per IP.

---

### POST /query

Answer a security knowledge question.

**Request**
```json
{"question": "What is the difference between authentication and authorisation?"}
```

**Response 200**
```json
{"answer": "Authentication verifies identity; authorisation determines permissions..."}
```

**Rate limit:** 30 requests / 60 s per IP.

---

### POST /analyse-document

Find security risks in a free-text document or code snippet.

**Request**
```json
{"text": "The application stores passwords in plaintext in the users table."}
```

**Response 200**
```json
{
  "findings": [
    {
      "title": "Plaintext password storage",
      "severity": "Critical",
      "description": "Passwords stored without hashing are exposed on database breach.",
      "recommendation": "Hash passwords with bcrypt, Argon2, or scrypt before storing."
    }
  ],
  "summary": "One critical finding identified related to credential storage."
}
```

**Rate limit:** 10 requests / 60 s per IP.

---

### GET /health

**Response 200**
```json
{"status": "ok"}
```

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `GROQ_API_KEY` | (required) | Groq API key |
| `GROQ_BASE_URL` | `https://api.groq.com/openai/v1` | Groq API base URL |
| `GROQ_MODEL` | `llama-3.1-70b-versatile` | Model to use for all completions |
| `GROQ_TIMEOUT_S` | `30` | HTTP timeout in seconds |
| `GROQ_MAX_RETRIES` | `3` | Max retries for rate-limit / server errors |
| `REDIS_URL` | `redis://localhost:6379/0` | Redis connection URL |
| `AI_CACHE_ENABLED` | `true` | Enable Redis response cache |
| `AI_CACHE_TTL_S` | `900` | Cache TTL in seconds (15 min) |
| `CORS_ORIGINS` | `*` | Comma-separated allowed CORS origins |
| `PORT` | `5000` | Port the Flask app listens on |
| `APP_ENV` | `dev` | Application environment |

---

## Caching

Responses from `/categorise` and `/generate-report` are cached in Redis keyed by a SHA-256 hash of the request payload (title + description + context or risks + audience + format). Cache is bypassed entirely when `AI_CACHE_ENABLED=false`.

## Fallback Behaviour

- `/categorise`: keyword-rule fallback; returns `"degraded": true`
- `/generate-report` and `/generate-report/stream`: deterministic severity-ordered report; returns `"degraded": true`
- `/describe`, `/recommend`, `/query`, `/analyse-document`: return HTTP 503 on model failure (no fallback)
