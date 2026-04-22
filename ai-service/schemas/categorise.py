from __future__ import annotations

from dataclasses import dataclass, field

ALLOWED_CATEGORIES = {
    "INJECTION",
    "BROKEN_AUTH",
    "SENSITIVE_DATA",
    "XXE",
    "BROKEN_ACCESS",
    "MISCONFIG",
    "XSS",
    "INSECURE_DESERIALIZATION",
    "VULNERABLE_COMPONENT",
    "INSUFFICIENT_LOGGING",
    "SSRF",
    "OTHER",
}

ALLOWED_SEVERITY = {"LOW", "MEDIUM", "HIGH", "CRITICAL"}


@dataclass
class CategoriseRequest:
    title: str
    description: str
    context: str = ""

    @classmethod
    def from_json(cls, data: dict) -> "CategoriseRequest":
        if not isinstance(data, dict):
            raise ValueError("body must be object")
        title = data.get("title", "").strip()
        description = data.get("description", "").strip()
        if not title or not description:
            raise ValueError("title and description required")
        if len(title) > 300 or len(description) > 8000:
            raise ValueError("title or description too long")
        return cls(title=title, description=description, context=str(data.get("context", "")).strip())


@dataclass
class CategoriseResult:
    category: str
    severity: str
    confidence: float
    rationale: str
    tags: list[str] = field(default_factory=list)

    def to_dict(self) -> dict:
        return {
            "category": self.category,
            "severity": self.severity,
            "confidence": self.confidence,
            "rationale": self.rationale,
            "tags": self.tags,
        }
