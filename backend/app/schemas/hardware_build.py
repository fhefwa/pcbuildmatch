"""Esquemas Pydantic para la validación de builds."""

from __future__ import annotations

from datetime import datetime
from typing import Any

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
    model_validator,
)


class ValidateBuildRequest(BaseModel):
    """Componentes enviados por el usuario para analizar."""

    components: list[dict[str, Any]] = Field(
        ...,
        min_length=1,
        max_length=50,
        description=(
            "Lista de componentes de la PC. Cada elemento debe ser un objeto JSON "
            "con los datos disponibles (tipo, marca, modelo, especificaciones)."
        ),
    )

    @model_validator(mode="before")
    @classmethod
    def accept_bare_list(cls, data: Any) -> Any:
        """Permite enviar directamente `[...]` además de `{"components": [...]}`."""
        if isinstance(data, list):
            return {"components": data}
        return data

    @field_validator("components")
    @classmethod
    def components_must_not_be_empty(
        cls, value: list[dict[str, Any]]
    ) -> list[dict[str, Any]]:
        for index, component in enumerate(value):
            if not component:
                raise ValueError(
                    f"El componente en la posición {index} no puede estar vacío."
                )
        return value


class BuildValidationResult(BaseModel):
    """Resultado estricto devuelto por el LLM."""

    compatibility_score: int = Field(..., ge=0, le=100)
    warnings: list[str] = Field(default_factory=list)
    detailed_feedback: str = Field(..., min_length=1)


class HardwareBuildResponse(BuildValidationResult):
    """Resultado guardado y devuelto por la API."""

    model_config = ConfigDict(from_attributes=True)

    id: int
    components_json: list[dict[str, Any]]
    created_at: datetime
