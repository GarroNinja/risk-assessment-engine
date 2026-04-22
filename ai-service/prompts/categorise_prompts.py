from __future__ import annotations

from schemas.categorise import ALLOWED_CATEGORIES, ALLOWED_SEVERITY

CATEGORISE_SYSTEM_V1 = (
    "You classify software security risks into OWASP Top 10 (2021) categories. "
    "Return only JSON matching the schema. Do not include prose outside JSON."
)


def build_categorise_user_v1(title: str, description: str, context: str) -> str:
    cats = ", ".join(sorted(ALLOWED_CATEGORIES))
    sev = ", ".join(sorted(ALLOWED_SEVERITY))
    extra = f"\n\nContext:\n{context}" if context else ""
    return (
        f"Classify this risk.\n\n"
        f"Title: {title}\n"
        f"Description: {description}"
        f"{extra}\n\n"
        f"Allowed categories: {cats}\n"
        f"Allowed severities: {sev}\n\n"
        "Respond with JSON: "
        '{"category": "...", "severity": "...", "confidence": 0.0-1.0, '
        '"rationale": "short reason", "tags": ["..."]}'
    )
