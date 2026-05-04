# Independent Security Audit — Week 3 catch-up (frontend + merged PRs)

**Author:** Ashakirana V
**Audit window:** 4 May 2026
**Scope expansion vs. PR #9:** This audit covers the React frontend (out of scope in PR #9) and the contents of merged PRs #1–#6 that landed before the original audit ran.

**Result: 19 findings — 2 Critical, 8 High, 6 Medium, 3 Low.**

**Sign-off status:** Refused — these findings join the PR #9 backlog. Combined re-test scheduled for Day 15.

---

## Methodology

- **Frontend:** static review of `frontend/src/` (~4,500 LOC across 7 pages, 9 components, 4 service modules). Cross-checked API contracts against backend controllers and AI-service blueprints.
- **Merged-PR review:** walked PR #1 (Sanjana — AI service Flask setup), PR #2 (Anushree — Java backend foundations), PR #4 (Shivakumar — frontend), PR #5 (Prathibha — Day 10 RBAC/Flyway/scheduler), PR #6 (GarroNinja — AI rate limit/fallbacks). Verified each merged into main is reachable from the running stack.
- **Out of scope:** browser-side auditing of dependency CVEs (`npm audit` requires a working install — recommended as a follow-up), penetration testing in a deployed environment.

---

## Top blockers for Demo Day (combined with PR #9)

- **F-029** (Critical): Frontend → backend API contract mismatch. `riskService.js` calls `/risks/...`; backend exposes `/api/risk-records/...`. **No risk-record functionality works end-to-end.** Verified by reading both sides; not a typo, six routes affected.
- **F-030** (Critical): Frontend → AI service. `aiService.js` calls 6 endpoints (`/describe`, `/recommend`, `/query`, `/analyse-document`, etc.) that **do not exist** in the AI service. The AI panel UI is wired to phantom routes. Combined with the unregistered blueprints (R-001 in remediation plan), the AI feature surface is entirely unreachable.
- **F-031** (High): SSE streaming sends payload as URL query string via `EventSource(url)`. User-supplied risk descriptions land in server access logs and proxy logs. Sensitive content leaks to log infrastructure.
- **F-035** (High): `ErrorBoundary` renders `error.toString()` to the user unconditionally despite a code comment claiming "dev mode only." Stack traces and accidental secrets reach end users in production.

---

## Critical findings

### F-029 · Frontend uses wrong API path prefix

- **File:** `frontend/src/services/riskService.js`
- **Severity:** Critical
- **Maps to:** R-001/R-004 family (runtime correctness, not security per se — but discovered during security review and gates everything else)

**Evidence:**
```javascript
// frontend
api.get('/risks/all')
api.post('/risks/create', data)
api.put(`/risks/${id}`, data)
```
```java
// backend (RiskRecordController.java)
@RequestMapping("/api/risk-records")
@GetMapping("/all")
@PostMapping("/create")
```

Every read/write of risk records returns `404`. The only reason this hasn't surfaced as a screaming bug in development is that the demo flow has not been walked end-to-end (verified via grep: no test in `RiskRecordControllerTest.java` exercises the path the frontend actually calls).

**Impact:** entire core feature non-functional.

**Fix:** rename the six methods in `riskService.js` to use `/api/risk-records/...` paths. 5-minute change.

---

### F-030 · AI service client points at non-existent endpoints

- **File:** `frontend/src/services/aiService.js`
- **Severity:** Critical

**Evidence — frontend calls:**
```javascript
export const describeRisk     = (data)  => aiApi.post('/describe', data)
export const recommendActions = (data)  => aiApi.post('/recommend', data)
export const categoriseRisk   = (data)  => aiApi.post('/categorise', data)
export const queryRag         = (q)     => aiApi.post('/query', { question: q })
export const generateReport   = (data)  => aiApi.post('/generate-report', data)
export const analyseDocument  = (text)  => aiApi.post('/analyse-document', { text })
```

**Evidence — AI service routes that exist:**
```python
# ai-service/app.py registers:
test_bp                      # → /test
# /health (defined inline)

# routes/categorise.py and routes/generate_report.py have:
# /categorise, /generate-report, /generate-report/stream
# but neither blueprint is registered (see R-001)
```

So:
- `/categorise` and `/generate-report` exist as code but unreachable until R-001 is fixed.
- `/describe`, `/recommend`, `/query`, `/analyse-document` **do not exist anywhere** in the AI service.

**Impact:** 4 of 4 tabs in `AiPanel.jsx` (Describe, Recommend, Categorise, RAG Query) hit dead routes.

**Fix:** decide service-of-record. If those endpoints are intended, AI service team needs to implement them. If not, frontend needs to drop the tabs and call only the routes that exist (`/categorise`, `/generate-report`, `/generate-report/stream`). Recommend the latter for the deadline.

---

## High-severity findings

### F-031 · SSE streaming leaks user input via URL

- **File:** `frontend/src/services/aiService.js` lines 20–40
- **Severity:** High

**Evidence:**
```javascript
const params = new URLSearchParams(
  Object.entries(payload).map(([k, v]) => [k, String(v)])
).toString()

const url = `${AI_URL}/generate-report/stream?${params}`
const es  = new EventSource(url)
```

The payload includes risk-record description, category, severity, and other user-entered content. It is concatenated into the URL query string. Browsers, reverse proxies (nginx, ELB), and application servers (Flask) all log full URLs. Any sensitive content typed into a risk description (employee name, attack target, vulnerability detail) lands in plaintext logs across the stack.

**Why this happened:** `EventSource` only supports GET. The author worked around the limitation by stuffing the body into the URL.

**Fix:** use `fetch()` with `Response.body.getReader()` to consume the SSE stream over POST. Or use a websocket. Native EventSource cannot be made safe for non-trivial payloads.

**Reproduction:** run the report-stream feature; observe `flask.log` line `INFO werkzeug "GET /generate-report/stream?description=<full+content>... HTTP/1.1"`.

---

### F-032 · JWT in `localStorage` (XSS → full account takeover)

- **File:** `frontend/src/context/AuthContext.jsx`, `frontend/src/services/api.js`
- **Severity:** High
- **Status:** Documented limitation — full fix scoped out for internship timeline

**Evidence:**
```javascript
localStorage.setItem('token', jwt)
const token = localStorage.getItem('token')
```

Any XSS in any of ~4,500 lines of React code can read the token and exfiltrate it. The frontend has no Content-Security-Policy header, no Trusted Types, no XSS-Auditor equivalent. While I found no `dangerouslySetInnerHTML` (good), the threat model assumes the codebase will grow.

**Recommendation:** for submission, document this as an accepted residual risk in `SECURITY.md` with a clear roadmap entry (httpOnly cookies + CSRF tokens). Full fix is roughly 1 day of work and not appropriate for the deadline.

---

### F-033 · No CSP, no security headers from frontend or its serving layer

- **Files:** `frontend/Dockerfile` (missing per R-002), `frontend/nginx.conf` (missing)
- **Severity:** High

The frontend has no Dockerfile shipped (R-002 in the remediation plan). Once one exists, it should include nginx headers:
- `Content-Security-Policy` (script-src self, style-src self+unsafe-inline for Tailwind, connect-src self+backend+ai-service, frame-ancestors none)
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: DENY` (or CSP frame-ancestors)
- `Strict-Transport-Security` (when HTTPS terminates upstream)

**Fix:** add headers to the nginx config that lands with R-002.

---

### F-034 · `ProtectedRoute` reads `role` that doesn't exist in `AuthContext`

- **File:** `frontend/src/components/ProtectedRoute.jsx` line 5; `frontend/src/context/AuthContext.jsx` line 20
- **Severity:** High

**Evidence:**
```javascript
// ProtectedRoute.jsx
const { isAuthenticated, role } = useAuth()
// ...
if (requiredRole && role !== requiredRole) {
  return <AccessDenied />
}
```
```javascript
// AuthContext.jsx — context value:
{ isAuthenticated: !!token, login, logout, token }
//                                            ^^^ no `role`, no `user`
```

`role` is always `undefined`. The role-gating mechanism is non-functional. Currently no page passes `requiredRole` so the bug is dormant — but the moment any developer adds `<ProtectedRoute requiredRole="ADMIN">`, every authenticated user (including VIEWER and EDITOR) gets locked out, OR (depending on framework version) gets through if the comparison short-circuits unexpectedly.

**Same issue affects** `Navbar.jsx` lines 81 and 151 which read `user.role` from a `user` that's also never provided by the context. Survives via optional chaining + `?? 'VIEWER'` fallback — i.e. **every user is displayed as VIEWER regardless of actual role.**

**Fix:** decode the JWT in `AuthContext` (use `jwt-decode`), expose `user` and `role` derived from claims. Backend must include `roles` in the JWT — currently `JwtUtil.generateToken()` only puts the username in the subject, no claims. So this fix is two-sided.

---

### F-035 · `ErrorBoundary` leaks stack traces in production

- **File:** `frontend/src/components/ErrorBoundary.jsx` lines 60–73
- **Severity:** High

**Evidence:**
```jsx
{/* error detail — dev mode */}
{this.state.error && (
  <div className="mb-6 text-left bg-red-50 border border-red-100 rounded-xl px-4 py-3">
    <p className="text-xs font-semibold text-red-600 mb-1">Error Details</p>
    <p className="text-xs text-red-500 font-mono break-all">
      {this.state.error.toString()}
    </p>
  </div>
)}
```

The comment says "dev mode" but there is no `import.meta.env.DEV` check. Stack traces, error messages from server responses, and any data that ends up in a thrown Error all reach the end user. Production users will see things like `TypeError: Cannot read property 'token' of null at AuthService.login (api.js:27)` exposing internal call sites.

**Fix:**
```jsx
{import.meta.env.DEV && this.state.error && ( ... )}
```

---

### F-036 · CORS posture is `withDefaults()` — frontend likely can't talk to backend

- **File:** `backend/.../config/SecurityConfig.java`
- **Severity:** High (functional + security)

`Customizer.withDefaults()` for CORS in Spring Security 6 means a no-op without an explicit `CorsConfigurationSource` bean. The frontend hits `:5173` (vite dev) or `:80` (nginx) and the backend on `:8080`. Without explicit CORS config, the browser blocks the request.

**Why this isn't already a known bug:** likely the team has been running through nginx proxy (per R-002 fix) which makes it same-origin, OR they've been running with browser CORS off, OR — more likely — they haven't tested end-to-end yet (see F-029).

**Fix:** add a `CorsConfigurationSource` bean explicitly listing allowed origins, methods, and headers.

---

### F-037 · `OPTIONS` and `HEAD` not handled in AI middleware → preflight failures

- **File:** `ai-service/middleware/security_middleware.py`
- **Severity:** Medium-High

**Evidence:**
```python
def security_middleware():
    if request.method in ["POST", "PUT", "PATCH"]:
        # ... validation
    return None
```

The middleware lets `OPTIONS` (CORS preflight), `GET`, `HEAD` and `DELETE` pass without validation — that part is intentional. But it returns `None`, which Flask treats as "continue." Combined with no CORS handling on the Flask side at all, browser-driven preflight requests will fail with no `Access-Control-Allow-*` headers in the response. The whole AI integration won't work cross-origin without nginx proxying.

**Fix:** install `flask-cors` and configure it explicitly. See remediation patches.

---

### F-038 · Login/registration password policy too weak

- **File:** `frontend/src/pages/LoginPage.jsx`, `RegisterPage.jsx`
- **Severity:** Medium-High

**Evidence:**
```javascript
// validate()
if (form.password.length < 6) errors.password = 'At least 6 characters required.'
```

6-character minimum, no complexity check, no breach-list check (HIBP). Frontend validation is also the only validation — backend `RegisterRequest.java` has no `@Size` or `@Pattern` annotations on the password field. Trivially bypassed by anyone hitting the API directly.

**Fix:** raise to 12 chars OR enforce complexity (mixed case + digit + special). Add Bean Validation annotations on the backend DTO. Optional: integrate `pwnedpasswords` API.

---

## Medium-severity findings

### F-039 · `aiService.js` defaults to plain HTTP localhost in production builds

- **File:** `frontend/src/services/aiService.js` line 3
- **Severity:** Medium

```javascript
const AI_BASE = import.meta.env.VITE_AI_URL ?? 'http://localhost:5000'
```

If `VITE_AI_URL` isn't set at build time, the production bundle ships pointing at `http://localhost:5000`. Vite inlines env vars at build time — there is no runtime fallback. Demo on a deployed environment without setting this var = AI features broken.

**Fix:** fail the build if `VITE_AI_URL` is missing (or remove the default and let it error visibly at runtime). Document required build-time env vars.

### F-040 · Vite config has no security-relevant settings

- **File:** `frontend/vite.config.js`
- **Severity:** Medium

```javascript
export default defineConfig({ plugins: [react()] })
```

Default Vite dev server binds to `127.0.0.1` (good) but accepts websocket from any origin (default config). For internship demo this is fine; flagging because `server.host: '0.0.0.0'` was tempted in earlier commit history.

### F-041 · Frontend never validates JWT expiry locally

- **File:** `frontend/src/context/AuthContext.jsx`, `api.js`
- **Severity:** Medium

The frontend treats "token exists in localStorage" as "authenticated." It never checks `exp`. A user with an expired token will see "logged in" UI, then get a 401 on the first request, then redirect to login. Wastes a roundtrip and leaks a cached page render of authenticated UI to the wrong session.

**Fix:** decode the token on load, check `exp`, treat expired as logged-out before any request.

### F-042 · `axios` interceptor redirect on 401 has a loop risk

- **File:** `frontend/src/services/api.js` lines 19–24
- **Severity:** Medium

```javascript
if (error.response?.status === 401) {
  localStorage.removeItem('token')
  window.location.href = '/login'
}
```

If the `/login` page is itself authenticated (it isn't, but if it became so), or if `window.location.href` is already `/login`, this creates a tight redirect loop. Add a guard: only redirect if not already on `/login`.

### F-043 · Email enumeration via registration error

- **File:** `backend/.../service/AuthService.java`
- **Severity:** Medium

```java
if (userRepo.existsByUsername(req.getUsername()))
    throw new IllegalArgumentException("Username already taken");
if (userRepo.existsByEmail(req.getEmail()))
    throw new IllegalArgumentException("Email already registered");
```

These distinct error messages let an attacker enumerate which usernames/emails are registered. Combine with no rate limit on `/auth/register` (no `@RateLimited` annotation, no Bucket4j) → account-existence leak at scale.

**Fix:** return a generic message ("Registration failed — check your input"). Rate-limit `/auth/register`.

### F-044 · `EmailService` likely vulnerable to email injection (header)

- **File:** `backend/.../service/EmailService.java`
- **Severity:** Medium (confirmation requires reading `EmailService` source — flagging based on the pattern in `OverdueNotificationService.java` where user-controlled fields could feed `setSubject()` or `setTo()`)

Recommend audit pass: confirm no user-controlled string flows unescaped into `MimeMessageHelper.setSubject()`, `setTo()`, or `setReplyTo()`. CRLF injection in any of these = arbitrary header injection.

---

## Low-severity findings

### F-045 · Tailwind compiled with full preflight reset on every page

Cosmetic / performance, not security. Flagging only because it shipped 4,263 lines of `package-lock.json` in the repo without any tree-shaking visible. Not a blocker.

### F-046 · `package.json` has no engines field

Missing `"engines": { "node": ">=20" }` means a teammate on Node 16 ships a build that breaks at runtime due to optional-chaining-in-assignment or similar. Hygiene.

### F-047 · Several `console.error` calls leak structured error objects in built bundle

`AiPanel.jsx`, `ReportStreamer.jsx`, `ErrorBoundary.jsx` log full error objects to console. Not exfiltrating, but noise pollution and a small privacy concern (URL of failed request appears in browser console — visible if user shares screen during support).

---

## Notes from merged-PR review

### PR #1 (Sanjana, Days 1–2 — AI service Flask + sanitization)
Already covered comprehensively by PR #9. No new findings.

### PR #2 (Anushree, Java backend foundations)
Largely fine as a structural build. The auth bypass (F-001 in PR #9) is on `SecurityConfig` which is in this PR's scope. The JWT secret default (F-002) lands in this PR. Both findings already documented.

**New finding from this PR:** F-043 (email enumeration). Not previously flagged.

### PR #4 (Shivakumar, frontend)
The frontend audit above (F-029 through F-047) covers PR #4's contents.

### PR #5 (Prathibha, Day 10 RBAC + audit + scheduler + docker-compose)

This is the PR with the most divergence between what was claimed and what shipped:
- **Claimed:** "RBAC working — VIEWER gets 403 on create"
- **Reality:** `RiskRecordController.java` has no `@PreAuthorize` annotations. `SecurityConfig` permits all. The VIEWER role can't be enforced because nothing checks it.
- **Audit logging via `AuditAspect`:** logs around `@AuditAction`-tagged methods. Reviewed `AuditAspect.java` — looks structurally correct, no SQL injection in log writes (uses repository, parameterized). Acceptable.
- **`OverdueNotificationService` + `ReminderScheduler`:** scheduler iterates risk records, sends emails via `EmailService`. Need to confirm F-044 risk doesn't materialize here. No critical issue identified; flagging for confirmation.

**New finding from this PR:** the gap between PR description and shipped code itself is a process issue worth flagging in the team retrospective — not a security finding, but the source of the false-RBAC-claim that PR #9 caught downstream.

### PR #6 (GarroNinja / Rithvik, AI rate limiting + fallbacks)
- `routes/categorise.py` and `routes/generate_report.py` have per-route `TokenBucket` rate limits. Combined with global `flask-limiter` registered in `app.py`, this is the duplicate-rate-limiter issue (H-03 in remediation plan). Not new — same finding.
- `services/fallbacks.py`: deterministic responses when Groq fails. Reviewed — no user input flows directly into the fallback string, which is good. Acceptable.

---

## Combined severity summary

| Source | Critical | High | Medium | Low | Total |
|---|---|---|---|---|---|
| PR #9 (audit-1) | 4 | 16 | 5 | 3 | 28 |
| This audit (audit-2) | 2 | 8 | 6 | 3 | 19 |
| **Combined backlog** | **6** | **24** | **11** | **6** | **47** |

---

## Reproduction scripts

Two new scripts under `security-reports/scripts/`:

- `run_audit_3.py` — frontend → backend contract checker. Loads `riskService.js` and `aiService.js` exports, walks them against the running backend's actual route table (via Spring's `actuator/mappings` or via a hand-built map), reports mismatches.
- `run_audit_4.py` — SSE leak demonstrator. Sends a flagged payload through `streamReport`, then greps the Flask access log for the payload string. Fails the test if the payload appears in logs.

Raw outputs under `security-reports/raw-output/run3-output.txt`, `run4-output.txt`.

---

## Sign-off conditions for combined audit (PR #9 + this audit)

Day-15 re-test must show:

- Critical findings (F-001 to F-004 from PR #9, F-029 and F-030 from this audit): **all ✓ FIXED**.
- High findings: **✓ FIXED** or **⚠ DOCUMENTED** in `SECURITY.md` with explicit residual-risk acceptance signed by tecsxpert.
- Medium and Low: tracked as issues in the backlog; need not block submission but must be visible.

Once these conditions are met I will grant sign-off in `SECURITY_REVIEW.md` and commit results to `security-reports/day-15-retest/`.
