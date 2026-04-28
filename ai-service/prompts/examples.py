from __future__ import annotations

CATEGORISE_FEW_SHOT = [
    {
        "title": "User search endpoint concatenates raw input into SQL",
        "description": (
            "GET /users?name= passes the value directly into a string-formatted "
            "SQL query. No parameterisation, no ORM."
        ),
        "expected": {
            "category": "INJECTION",
            "severity": "CRITICAL",
            "confidence": 0.95,
            "rationale": "Raw user input concatenated into SQL is textbook SQLi.",
            "tags": ["sql-injection", "input-validation"],
        },
    },
    {
        "title": "JWT signature verification disabled in dev profile",
        "description": (
            "AuthFilter skips verify() when spring.profiles.active=dev. Tokens "
            "are still accepted in pre-prod."
        ),
        "expected": {
            "category": "BROKEN_AUTH",
            "severity": "HIGH",
            "confidence": 0.9,
            "rationale": "Skipping JWT verification trivially allows forged tokens.",
            "tags": ["jwt-verification", "auth-bypass"],
        },
    },
    {
        "title": "Internal admin URL accessible without role check",
        "description": (
            "/admin/users returns full PII for any authenticated user; the "
            "@PreAuthorize annotation is missing."
        ),
        "expected": {
            "category": "BROKEN_ACCESS",
            "severity": "HIGH",
            "confidence": 0.92,
            "rationale": "No authorisation check means any logged-in user reaches admin data.",
            "tags": ["authorization", "missing-rbac"],
        },
    },
]


REPORT_FEW_SHOT_HEADERS = {
    "engineer": "Engineering report — focus on remediation steps, libraries, and config.",
    "manager": "Management report — focus on prioritisation, ownership, and effort.",
    "executive": "Executive report — focus on business impact and decisions.",
}
