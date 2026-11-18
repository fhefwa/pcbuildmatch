"""Configuración de la aplicación cargada desde variables de entorno."""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict

BASE_DIR = Path(__file__).resolve().parents[2]


class Settings(BaseSettings):
    """Configuración tipada de PCBuildMatch."""

    model_config = SettingsConfigDict(
        env_file=BASE_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # Aplicación
    app_name: str = "PCBuildMatch"
    app_env: str = "development"
    debug: bool = True
    api_prefix: str = "/api"
    backend_cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"

    # Base de datos
    database_url: str

    # Proveedores de IA
    ai_provider: str = "gemini"
    ai_timeout_seconds: float = 60.0

    openai_api_key: str | None = None
    anthropic_api_key: str | None = None
    gemini_api_key: str | None = None
    deepseek_api_key: str | None = None

    openai_model: str | None = None
    anthropic_model: str | None = None
    gemini_model: str = "gemini-3.5-flash"
    gemini_fallback_models: str = (
        "gemini-3.5-flash-lite,gemini-3.1-flash-lite,gemini-flash-lite-latest"
    )
    deepseek_model: str = "deepseek-v4-pro"

    openai_base_url: str = "https://api.openai.com/v1"
    deepseek_base_url: str = "https://api.deepseek.com"

    @field_validator("ai_provider")
    @classmethod
    def validate_ai_provider(cls, value: str) -> str:
        normalized = value.strip().lower()
        allowed = {"openai", "anthropic", "gemini", "deepseek"}
        if normalized not in allowed:
            raise ValueError(
                f"AI_PROVIDER debe ser uno de: {', '.join(sorted(allowed))}"
            )
        return normalized

    @field_validator("api_prefix")
    @classmethod
    def normalize_api_prefix(cls, value: str) -> str:
        cleaned = value.strip().strip("/")
        return f"/{cleaned}" if cleaned else ""

    @property
    def cors_origins(self) -> list[str]:
        return [
            origin.strip()
            for origin in self.backend_cors_origins.split(",")
            if origin.strip()
        ]

    @property
    def gemini_models(self) -> list[str]:
        """Cadena de modelos Gemini: principal primero, luego respaldos."""
        chain: list[str] = []

        for raw_model in (self.gemini_model, *self.gemini_fallback_models.split(",")):
            model = raw_model.strip().removeprefix("models/")
            if model and model not in chain:
                chain.append(model)

        return chain


@lru_cache
def get_settings() -> Settings:
    """Devuelve una única instancia de configuración por proceso."""
    return Settings()
