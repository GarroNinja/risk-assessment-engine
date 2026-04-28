from __future__ import annotations

from prompts.examples import REPORT_FEW_SHOT_HEADERS

REPORT_SYSTEM_V1 = (
    "You are a security risk reporter. Produce concise, accurate risk reports "
    "for the requested audience. Use only the information provided; do not invent risks."
)

REPORT_SYSTEM_V2 = (
    "You are a security risk reporter writing for a specific audience. "
    "Produce concise, accurate reports using only the supplied risk list — never invent risks.\n\n"
    "Hard rules:\n"
    "- Order risks by severity desc (CRITICAL, HIGH, MEDIUM, LOW), then by category.\n"
    "- Use Markdown headings exactly as instructed.\n"
    "- Do not output explanations about your process; output the report itself.\n"
    "- If a risk lacks detail, say 'requires investigation' rather than guessing."
)


_AUDIENCE_GUIDANCE = {
    "engineer": (
        "Write for engineers. Each risk gets a 'Mitigation' bullet list with "
        "concrete remediations: library/version, config flags, exact code change."
    ),
    "manager": (
        "Write for engineering managers. Group related risks. Add an 'Effort' "
        "bullet (S/M/L) and 'Owner suggestion' (team or role) per risk. No code."
    ),
    "executive": (
        "Write for executives. Plain language. Lead with business impact. "
        "End with a numbered priority list of at most 5 actions. No code, no jargon."
    ),
}


def build_report_user_v1(*, risks, audience, fmt, project_name):
    proj_line = f"Project: {project_name}\n" if project_name else ""
    aud = _AUDIENCE_GUIDANCE.get(audience, _AUDIENCE_GUIDANCE["engineer"])
    block = "\n".join(
        f"- [{r.get('severity', 'MEDIUM')}/{r.get('category', 'OTHER')}] "
        f"{r.get('title', '')}: {r.get('description', '')}"
        for r in risks
    )
    if fmt == "summary":
        format_line = (
            "Output a short Markdown summary: 1 paragraph overview, "
            "then a bullet list of top 5 risks with severity prefix."
        )
    else:
        format_line = (
            "Output a Markdown report with sections: "
            "## Overview, ## Risks (subsection per risk), ## Recommended Actions."
        )
    return (
        f"{proj_line}"
        f"Audience guidance: {aud}\n\n"
        f"Format: {format_line}\n\n"
        f"Risks:\n{block}"
    )


def build_report_user_v2(*, risks, audience, fmt, project_name):
    header = REPORT_FEW_SHOT_HEADERS.get(audience, REPORT_FEW_SHOT_HEADERS["engineer"])
    proj_line = f"Project: {project_name}\n" if project_name else ""
    aud = _AUDIENCE_GUIDANCE.get(audience, _AUDIENCE_GUIDANCE["engineer"])
    sev_order = {"CRITICAL": 0, "HIGH": 1, "MEDIUM": 2, "LOW": 3}
    sorted_risks = sorted(
        risks,
        key=lambda r: (sev_order.get(str(r.get("severity", "MEDIUM")).upper(), 4),
                       str(r.get("category", "OTHER"))),
    )
    block = "\n".join(
        f"- [{r.get('severity', 'MEDIUM')}/{r.get('category', 'OTHER')}] "
        f"{r.get('title', '')}: {r.get('description', '')}"
        for r in sorted_risks
    )
    if fmt == "summary":
        format_line = (
            "Output a Markdown summary: ## Overview paragraph, then a bullet "
            "list of the top 5 risks ordered by severity."
        )
    else:
        format_line = (
            "Output a Markdown report with these exact sections in order:\n"
            "## Overview\n"
            "## Risks (one '### {title}' subsection per risk)\n"
            "## Recommended Actions"
        )
    return (
        f"{header}\n"
        f"{proj_line}"
        f"Audience guidance: {aud}\n\n"
        f"Format: {format_line}\n\n"
        f"Risks (sorted, severity desc):\n{block}"
    )
