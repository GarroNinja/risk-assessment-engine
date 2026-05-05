import json
from unittest.mock import MagicMock

import pytest

from clients.groq_errors import GroqError
from schemas.categorise import CategoriseRequest
from services.categoriser import Categoriser, CategoriserError


def _groq_with_response(payload: dict) -> MagicMock:
    groq = MagicMock()
    groq.chat.return_value = {
        "choices": [{"message": {"content": json.dumps(payload)}}],
        "model": "test",
        "usage": {},
    }
    return groq


def _req(title="SQL login bypass", description="User input appended to query without sanitisation") -> CategoriseRequest:
    return CategoriseRequest(title=title, description=description)


def test_unknown_category_returns_other():
    groq = _groq_with_response({
        "category": "TOTALLY_UNKNOWN",
        "severity": "HIGH",
        "confidence": 0.8,
        "rationale": "some reason",
        "tags": [],
    })
    result = Categoriser(groq).categorise(_req())
    assert result.category == "OTHER"


def test_confidence_clamped_above_one():
    groq = _groq_with_response({
        "category": "INJECTION",
        "severity": "HIGH",
        "confidence": 1.5,
        "rationale": "clear sql injection",
        "tags": [],
    })
    result = Categoriser(groq).categorise(_req())
    assert result.confidence == 1.0


def test_propagates_groq_error():
    groq = MagicMock()
    groq.chat.side_effect = GroqError("api down")
    with pytest.raises(CategoriserError):
        Categoriser(groq).categorise(_req())


def test_rejects_empty_fields():
    with pytest.raises(ValueError):
        CategoriseRequest.from_json({"title": "", "description": "something"})
    with pytest.raises(ValueError):
        CategoriseRequest.from_json({"title": "something", "description": ""})
