from unittest.mock import MagicMock

import pytest

from clients.groq_errors import GroqError
from schemas.report import ReportRequest, RiskItem
from services.report_generator import ReportGenerator, ReportGeneratorError


def _req() -> ReportRequest:
    return ReportRequest(
        risks=[RiskItem(title="SQL Injection", description="Unsanitised query params", severity="HIGH")],
        audience="engineer",
        format="markdown",
        project_name="TestApp",
    )


def _groq_with_content(text: str) -> MagicMock:
    groq = MagicMock()
    groq.chat.return_value = {
        "choices": [{"message": {"content": text}}],
        "model": "test",
        "usage": {"total_tokens": 10},
    }
    return groq


def test_generate_returns_content():
    groq = _groq_with_content("## Overview\nThis is the report.")
    result = ReportGenerator(groq).generate(_req())
    assert "Overview" in result.content
    assert result.risk_count == 1


def test_generate_propagates_error():
    groq = MagicMock()
    groq.chat.side_effect = GroqError("timeout")
    with pytest.raises(ReportGeneratorError):
        ReportGenerator(groq).generate(_req())


def test_stream_yields_pieces():
    groq = MagicMock()
    groq.chat_stream.return_value = iter(["part1", " part2", " part3"])
    pieces = list(ReportGenerator(groq).generate_stream(_req()))
    assert pieces == ["part1", " part2", " part3"]


def test_rejects_empty_risks():
    with pytest.raises(ValueError):
        ReportRequest.from_json({"risks": [], "audience": "engineer", "format": "markdown"})
