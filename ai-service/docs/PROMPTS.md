# Prompt Engineering Reference

## Categorise Prompts

| Version | File | Description |
|---|---|---|
| v1 | `prompts/categorise_prompts.py` | Minimal instruction, single-turn, no examples |
| v2 | `prompts/categorise_prompts.py` | Senior AppSec persona, explicit rules, structured output spec |
| v3 | `prompts/categorise_prompts.py` | v2 + few-shot examples appended to system prompt |

Active version: **v3** (set in `app_extensions.py` via `Categoriser(..., prompt_version="v3")`).

### Version Changelog

**v1 → v2**
- Added explicit rules block (category must be from allowed set, confidence semantics, rationale length, tag format)
- Tightened output spec: no code fences, no trailing commas
- Reduced hallucination of invented categories by ~40% on manual eval

**v2 → v3**
- Appended few-shot examples from `prompts/examples.py`
- Examples demonstrate correct JSON shape and boundary cases (low-confidence OTHER, multi-tag output)
- Improved consistency on ambiguous inputs

### Design Decisions

- **Temperature 0.1** — classification is deterministic; low temperature reduces variance
- **max_tokens 400** — JSON output for this schema is never more than ~200 tokens; 400 provides headroom
- **response_format json_object** — enforces JSON mode at the API level; eliminates code-fence wrapping

---

## Report Prompts

| Version | File | Description |
|---|---|---|
| v1 | `prompts/report_prompts.py` | Basic system prompt, user message with flat risk list |
| v2 | `prompts/report_prompts.py` | Hard rules for ordering/headings, audience-specific guidance, few-shot header per audience |

Active version: **v2** (hardcoded in `ReportGenerator`).

### Version Changelog

**v1 → v2**
- Added hard rules: severity ordering (CRITICAL → HIGH → MEDIUM → LOW), exact Markdown heading structure
- Per-audience guidance: engineers get concrete mitigations with version/config details; managers get effort/owner; executives get plain language + priority list
- Pre-sorts risks in the user message (server-side) so the model is not relied upon for ordering
- Added few-shot section headers from `prompts/examples.py` to anchor report structure

### Design Decisions

- **Temperature 0.3** — reports benefit from slightly more varied prose than classification
- **max_tokens 2048** — full reports for 10+ risks require headroom; summary format uses same limit
- **No response_format json_object** — report output is Markdown, not JSON

---

## How to Add a New Prompt Version

1. Add the new system prompt constant and builder function to the relevant file in `prompts/`.
2. For categorise: add a branch in `Categoriser._build_messages()` for the new version key.
3. For report: update `ReportGenerator._messages()` to reference the new constants.
4. Update `Categoriser` default `prompt_version` in `app_extensions.py` after manual evaluation.
5. Add the version to the table above with a changelog entry.
6. Run the test suite; add a test case to `tests/test_categoriser.py` or `tests/test_report_generator.py` that exercises the new version with a representative input.
