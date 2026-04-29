from __future__ import annotations

from schemas.categorise import CategoriseRequest, CategoriseResult
from schemas.report import ReportRequest, ReportResult

_KEYWORD_RULES = [
    (("sql", "query", "concat", "drop table"), "INJECTION", "HIGH"),
    (("xss", "script", "innerhtml"), "XSS", "MEDIUM"),
    (("jwt", "token", "auth", "password"), "BROKEN_AUTH", "HIGH"),
    (("admin", "role", "privilege", "rbac"), "BROKEN_ACCESS", "HIGH"),
    (("config", "default", "secret", "env"), "MISCONFIG", "MEDIUM"),
    (("ssrf", "internal url", "metadata"), "SSRF", "HIGH"),
    (("xml", "xxe", "entity"), "XXE", "MEDIUM"),
    (("deserial", "pickle", "unmarshal"), "INSECURE_DESERIALIZATION", "HIGH"),
    (("dependency", "cve", "outdated", "vulnerable lib"), "VULNERABLE_COMPONENT", "MEDIUM"),
    (("log", "audit", "monitor"), "INSUFFICIENT_LOGGING", "LOW"),
    (("pii", "ssn", "credit card", "leak"), "SENSITIVE_DATA", "HIGH"),
]


def categorise_fallback(req: CategoriseRequest) -> CategoriseResult:
    text = f"{req.title} {req.description}".lower()
    for keywords, cat, sev in _KEYWORD_RULES:
        if any(k in text for k in keywords):
            return CategoriseResult(
                category=cat,
                severity=sev,
                confidence=0.4,
                rationale="keyword-based fallback (model unavailable)",
                tags=["fallback"],
            )
    return CategoriseResult(
        category="OTHER",
        severity="MEDIUM",
        confidence=0.2,
        rationale="no keyword match (model unavailable)",
        tags=["fallback"],
    )


def report_fallback(req: ReportRequest) -> ReportResult:
    sev_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
    risks = sorted(req.risks, key=lambda r: sev_order.get(r.severity, 4))
    lines = ["## Overview", "AI service unavailable; this report is a deterministic fallback.", "", "## Risks"]
    for r in risks:
        lines.append(f"### {r.title}")
        lines.append(f"- Severity: {r.severity}")
        lines.append(f"- Category: {r.category}")
        lines.append(f"- Description: {r.description}")
        lines.append("")
    lines.append("## Recommended Actions")
    lines.append("- Triage CRITICAL/HIGH first; assign owners; rerun once AI is available for tailored guidance.")
    return ReportResult(
        content="\n".join(lines),
        audience=req.audience,
        format=req.format,
        risk_count=len(req.risks),
        metadata={"fallback": True},
    )
