import os
from dataclasses import dataclass


@dataclass(frozen=True)
class GroqConfig:
    api_key: str
    base_url: str
    model: str
    timeout_s: float
    max_retries: int


@dataclass(frozen=True)
class CacheConfig:
    url: str
    default_ttl_s: int
    enabled: bool


@dataclass(frozen=True)
class AppConfig:
    groq: GroqConfig
    cache: CacheConfig
    env: str


def _env(key: str, default: str | None = None, required: bool = False) -> str:
    val = os.getenv(key, default)
    if required and not val:
        raise RuntimeError(f"missing env var: {key}")
    return val or ""


def load_config() -> AppConfig:
    return AppConfig(
        env=_env("APP_ENV", "dev"),
        groq=GroqConfig(
            api_key=_env("GROQ_API_KEY", required=True),
            base_url=_env("GROQ_BASE_URL", "https://api.groq.com/openai/v1"),
            model=_env("GROQ_MODEL", "llama-3.1-70b-versatile"),
            timeout_s=float(_env("GROQ_TIMEOUT_S", "30")),
            max_retries=int(_env("GROQ_MAX_RETRIES", "3")),
        ),
        cache=CacheConfig(
            url=_env("REDIS_URL", "redis://localhost:6379/0"),
            default_ttl_s=int(_env("AI_CACHE_TTL_S", "900")),
            enabled=_env("AI_CACHE_ENABLED", "true").lower() == "true",
        ),
    )
