"""Endpoint para validar y guardar builds de hardware."""

from __future__ import annotations

import logging

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.hardware_build import HardwareBuild
from app.schemas.hardware_build import HardwareBuildResponse, ValidateBuildRequest
from app.services.ai import AIProviderError, validate_build_with_ai

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post(
    "/validate-build",
    response_model=HardwareBuildResponse,
    status_code=status.HTTP_201_CREATED,
    summary="Valida la compatibilidad de una build con IA",
    description=(
        "Analiza los componentes con un LLM, guarda el resultado en PostgreSQL "
        "y devuelve el registro creado."
    ),
)
def validate_build(
    payload: ValidateBuildRequest,
    db: Session = Depends(get_db),
) -> HardwareBuild:
    try:
        result = validate_build_with_ai(payload.components)
    except AIProviderError as exc:
        logger.warning("Error del proveedor de IA: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=str(exc),
        ) from exc

    build = HardwareBuild(
        components_json=payload.components,
        compatibility_score=result.compatibility_score,
        warnings=result.warnings,
        detailed_feedback=result.detailed_feedback,
    )

    try:
        db.add(build)
        db.commit()
        db.refresh(build)
    except SQLAlchemyError as exc:
        db.rollback()
        logger.exception("No se pudo guardar la build en PostgreSQL.")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo guardar el análisis en la base de datos.",
        ) from exc

    return build
