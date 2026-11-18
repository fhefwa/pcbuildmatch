"""Router agregador de la API."""

from fastapi import APIRouter

from app.api.v1.routes import builds

api_router = APIRouter()
api_router.include_router(builds.router, tags=["builds"])
