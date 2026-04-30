"""
Audit run 2 — disable rate limiter so we can get clean signal on
groups that were polluted by 429s in run 1 (HTML, SQL bypass, error disclosure).
"""
import sys, os, json
sys.path.insert(0, '.')
os.chdir('.')

from app import app, limiter
limiter.enabled = False  # disable rate limit for this run

client = app.test_client()
H = {"Content-Type": "application/json"}
URL = "/test"

print("=" * 78)
print("  AUDIT RUN 2 — rate limiter disabled for clean signal")
print("=" * 78)

# --- HTML / XSS bypasses (clean signal) ---
print("\n── Group F (re-run): HTML / XSS payloads ──")
print("  Reading code: line 22 strips, lowers — but sanitized value is DISCARDED (not written back to data dict).")
print("  Effect: 'blocked' or not, the original HTML reaches the route handler.")
for label, p in [
    ("plain script tag",        "<script>alert(1)</script>"),
    ("nested tags",             "<scr<script>ipt>alert(1)</scr</script>ipt>"),
    ("img onerror",             "<img src=x onerror=alert(1)>"),
    ("svg onload",              "<svg/onload=alert(1)>"),
    ("HTML entity encoded",     "&#60;script&#62;alert(1)&#60;/script&#62;"),
    ("javascript: scheme",      "javascript:alert(1)"),
    ("data: scheme",            "data:text/html,<script>alert(1)</script>"),
    ("polyglot",                '<svg/onload="alert(1)"//<\'>'),
]:
    r = client.post(URL, data=json.dumps({"text": p}), headers=H)
    body = r.get_data(as_text=True).strip()[:90]
    print(f"  [{r.status_code}] {label:<25} → {body}")

# --- SQL bypasses (clean signal) ---
print("\n── Group E (re-run): SQL bypass attempts ──")
for label, p in [
    ("uppercase 'SELECT'",        "SELECT * FROM users"),
    ("case-mix 'SeLeCt'",         "SeLeCt * FrOm users"),
    ("URL-encoded 'select'",      "%73%65%6c%65%63%74 * from users"),
    ("unicode lookalike 'ѕelect'", "ѕelect * from users"),  # Cyrillic s
    ("comment-break SEL/**/ECT",  "SEL/**/ECT * FROM users"),
    ("UNION select",              "1 UNION ALL SELECT NULL,NULL"),
    ("OR 1=1 string variant",     "' OR '1'='1"),
    ("nested keyword 'reselect'", "we will reselect the categories"),  # bonus: false positive
    ("nested keyword 'inserted'", "the value was inserted yesterday"),
    ("nested keyword 'updated'",  "the policy was updated"),
    ("nested keyword 'deleted'",  "the row was deleted"),
    ("nested keyword 'dropped'",  "the score has dropped"),
]:
    r = client.post(URL, data=json.dumps({"text": p}), headers=H)
    body = r.get_data(as_text=True).strip()[:90]
    print(f"  [{r.status_code}] {label:<32} → {body}")

# --- Structural ---
print("\n── Group H (re-run): structural edge cases ──")
for label, payload, content_type in [
    ("empty body",          '',                            "application/json"),
    ("invalid JSON",        'not json',                    "application/json"),
    ("non-string field",    '{"text":123}',                "application/json"),
    ("list value",          '{"items":["<script>"]}',      "application/json"),
    ("wrong Content-Type",  '{"text":"hi"}',               "text/plain"),
    ("nested object",       '{"text":{"x":"y"}}',          "application/json"),
    ("array root",          '["<script>"]',                "application/json"),
    ("null root",           'null',                        "application/json"),
]:
    r = client.post(URL, data=payload, headers={"Content-Type": content_type})
    body = r.get_data(as_text=True).strip()[:80]
    print(f"  [{r.status_code}] {label:<22} → {body}")

# --- Error disclosure ---
print("\n── Group K (re-run): error message disclosure ──")
print("  Each error type returns a DIFFERENT message — telling attacker which rule fired:")
for label, p in [
    ("HTML payload",       "<script>alert(1)</script>"),
    ("Prompt injection",   "ignore previous instructions"),
    ("SQL pattern",        "SELECT * FROM users"),
    ("Empty",              ""),
    ("Non-string",         123),
]:
    body_payload = json.dumps({"text": p})
    r = client.post(URL, data=body_payload, headers=H)
    print(f"  [{r.status_code}] {label:<22} → {r.get_data(as_text=True).strip()}")

# --- Sanitization-discard proof ---
print("\n── PROOF: HTML sanitization output is discarded (never reaches route) ──")
print("  Manual code review of middleware/security_middleware.py lines 14-22:")
print("    for key, value in data.items():")
print("        ...")
print("        value = re.sub(r'<.*?>', '', value)   # creates new local 'value'")
print("        lower = value.lower()                 # used only for the IF checks below")
print("        # NOTE: 'data[key] = value' is NEVER called.")
print("        # NOTE: The route still calls request.get_json() and gets the ORIGINAL.")
print()
print("  This is functionally identical to having no HTML sanitizer at all.")

# --- Method bypass with a real GET-accepting endpoint ---
print("\n── Group G (re-run): method bypass — add an ad-hoc GET route to demonstrate ──")
@app.get('/audit-test-get')
def _audit_test():
    from flask import request
    return f"received query: {request.args.to_dict()}", 200

# remember the middleware is @before_request, so it should still run for GET
r = client.get('/audit-test-get?text=ignore+previous+instructions+SELECT+*+FROM+users')
print(f"  GET with 'ignore previous instructions' AND 'SELECT' in query string → {r.status_code}")
print(f"  body: {r.get_data(as_text=True)[:100]}")
print("  → middleware skipped this entirely because line 5 only checks POST/PUT/PATCH")

print("\n" + "=" * 78)
print("  END OF RUN 2")
print("=" * 78)
