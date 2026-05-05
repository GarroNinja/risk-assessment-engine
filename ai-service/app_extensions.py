from flask import Flask

from cache import build_cache
from clients import GroqClient
from config import load_config
from services.categoriser import Categoriser
from services.report_generator import ReportGenerator


def init_ai_extensions(app: Flask) -> None:
    cfg = load_config()
    groq = GroqClient(cfg.groq)
    cache = build_cache(cfg.cache)
    categoriser = Categoriser(groq, cache=cache, prompt_version="v3", cache_ttl_s=cfg.cache.default_ttl_s)
    report_gen = ReportGenerator(groq, cache=cache, cache_ttl_s=cfg.cache.default_ttl_s)
    app.extensions["groq"] = groq
    app.extensions["categoriser"] = categoriser
    app.extensions["report_generator"] = report_gen
