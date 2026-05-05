import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parents[1]))

import pytest

from app import create_app


@pytest.fixture()
def client():
    app = create_app()
    app.config["TESTING"] = True
    with app.test_client() as c:
        yield c


def test_rejects_array_body(client):
    resp = client.post(
        "/categorise",
        data=json.dumps([{"title": "x"}]),
        content_type="application/json",
    )
    assert resp.status_code == 400
    assert "object" in resp.get_json()["error"].lower()


def test_rejects_non_json(client):
    resp = client.post("/categorise", data="not json at all", content_type="text/plain")
    assert resp.status_code == 400


def test_accepts_valid_dict(client):
    resp = client.post(
        "/categorise",
        data=json.dumps({"title": "SQL injection risk", "description": "User input passed directly into query"}),
        content_type="application/json",
    )
    assert resp.status_code in (200, 429)


def test_rejects_oversized_field(client):
    big = "x" * 60_000
    resp = client.post(
        "/categorise",
        data=json.dumps({"title": "test", "description": big}),
        content_type="application/json",
    )
    assert resp.status_code == 400
    assert "size" in resp.get_json()["error"].lower()


def test_allows_get_request(client):
    resp = client.get("/health")
    assert resp.status_code == 200


def test_allows_legitimate_prose_with_sql_words(client):
    description = (
        "The application should select the correct user record. "
        "Developers update the database schema and drop unused columns. "
        "The delete operation is handled by a stored procedure."
    )
    resp = client.post(
        "/categorise",
        data=json.dumps({"title": "DB operations review", "description": description}),
        content_type="application/json",
    )
    assert resp.status_code in (200, 429)
