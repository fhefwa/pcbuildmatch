"""Integración con proveedores de IA para validar builds de hardware."""

from __future__ import annotations

import json
import logging
import re
import time
from typing import Any

import httpx
from anthropic import Anthropic
from openai import OpenAI
from pydantic import ValidationError

from app.core.config import Settings, get_settings
from app.schemas.hardware_build import BuildValidationResult

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """
Eres un técnico de hardware de PC con más de 20 años de experiencia en armado,
diagnóstico y compatibilidad de equipos de escritorio. Tu tarea es analizar una
build y devolver un veredicto técnico.

REGLAS OBLIGATORIAS:
1. Analiza únicamente los componentes y datos incluidos en la lista. No inventes
   especificaciones ni agregues componentes que el usuario no haya mencionado.
2. Si falta un dato crítico (socket, chipset, tipo de memoria, capacidad, TDP,
   longitud de la GPU, potencia de la fuente, versión de BIOS, etc.), inclúyelo
   como advertencia y reduce el compatibility_score.
3. Verifica como mínimo:
   - CPU ↔ motherboard: socket físico (AM4, AM5, LGA1700, LGA1851, etc.),
     chipset, generación y soporte de BIOS.
   - RAM ↔ motherboard/CPU: DDR4 vs DDR5, velocidad, capacidad, canales,
     EXPO/XMP y límites del controlador de memoria.
   - GPU ↔ motherboard/fuente/gabinete: PCIe, longitud, slots, conectores de
     alimentación y potencia recomendada.
   - Refrigeración ↔ CPU/gabinete: socket, TDP, altura del disipador, tamaño del
     radiador, ventiladores y headers disponibles.
   - Fuente ↔ build: potencia real, conectores EPS/PCIe, eficiencia y
     protecciones.
   - Almacenamiento ↔ motherboard: M.2/SATA, lanes PCIe y tamaño.
   - Cableado y compatibilidad eléctrica: headers CPU_FAN, AIO_PUMP,
     SYS_FAN/CHA_FAN; 3 pines vs 4 pines; PWM vs control por voltaje; sensor de
     RPM/tach; alineación del pin 1; pin 4 PWM sin conectar cuando se usa un
     conector de 3 pines; bomba AIO alimentada por SATA/Molex o por header según
     el modelo; no superar la corriente del header; consultar el manual de la
     motherboard.
4. Casos concretos que debés evaluar:
   - Un Ryzen AM5 en una motherboard MSI AM5 con DDR5 es compatible si el
     chipset y la BIOS soportan ese CPU.
   - Un Ryzen AM5 en una motherboard AM4 no es compatible.
   - Memoria DDR5 en una motherboard DDR4 no es compatible (y viceversa).
   - Un conector de 3 pines de un ventilador o bomba en un header de 4 pines
     puede funcionar si se alinea el pin 1 (GND); el pin 4 (PWM) queda sin
     conectar y el control puede ser por voltaje. El sensor de RPM (pin 3/tach)
     sigue funcionando. Si es la bomba de un AIO, usá preferentemente el header
     AIO_PUMP y verificá que soporte la corriente; si el cable de 3 pines es
     solo de sensor, no alimenta la bomba.
   - No confundas el conector de alimentación de la bomba (SATA/Molex) con el
     conector de 3 pines del sensor de RPM.
5. Sé conservador: si no podés confirmar una compatibilidad, no la apruebes. Un
   score de 100 solo se justifica si todos los componentes son compatibles y la
   información es suficiente.
6. Cada advertencia debe ser concreta, accionable y estar en español. No repitas
   la misma advertencia.
7. Devuelve SOLO un objeto JSON válido, sin markdown, sin explicaciones fuera del
   JSON, con exactamente estas claves:
   {
     "compatibility_score": 0,
     "warnings": ["..."],
     "detailed_feedback": "..."
   }
8. compatibility_score debe ser un entero entre 0 y 100.
9. warnings debe ser un array de strings. Si no hay advertencias, devolvé [].
10. detailed_feedback debe ser un texto técnico en español que explique el
    veredicto, las verificaciones realizadas y cómo resolver los problemas de
    cableado/eléctricos. No incluyas JSON dentro de este campo.
11. No agregues claves adicionales.
""".strip()

GEMINI_RESPONSE_SCHEMA: dict[str, Any] = {
    "type": "OBJECT",
    "properties": {
        "compatibility_score": {
            "type": "INTEGER",
            "description": "Puntaje entero de compatibilidad entre 0 y 100.",
        },
        "warnings": {
            "type": "ARRAY",
            "items": {"type": "STRING"},
            "description": "Advertencias concretas y accionables en español.",
        },
        "detailed_feedback": {
            "type": "STRING",
            "description": (
                "Explicación técnica del veredicto y de cómo resolver los "
                "problemas detectados."
            ),
        },
    },
    "required": ["compatibility_score", "warnings", "detailed_feedback"],
}


class AIProviderError(RuntimeError):
    """Error controlado al comunicarse con el proveedor de IA."""


def validate_build_with_ai(
    components: list[dict[str, Any]],
) -> BuildValidationResult:
    """Envía la build al proveedor configurado y valida el JSON devuelto."""
    settings = get_settings()
    user_prompt = _build_user_prompt(components)
    provider = settings.ai_provider

    logger.info("Validando build con proveedor=%s", provider)

    if provider == "gemini":
        raw_response = _call_gemini(settings, user_prompt)
    elif provider == "deepseek":
        raw_response = _call_deepseek(settings, user_prompt)
    elif provider == "openai":
        raw_response = _call_openai(settings, user_prompt)
    elif provider == "anthropic":
        raw_response = _call_anthropic(settings, user_prompt)
    else:
        raise AIProviderError(f"Proveedor de IA no soportado: {provider}")

    return _parse_ai_response(raw_response)


def _build_user_prompt(components: list[dict[str, Any]]) -> str:
    components_json = json.dumps(components, ensure_ascii=False, indent=2)
    return (
        "Analizá la siguiente build de PC. La lista contiene únicamente los "
        "componentes y datos aportados por el usuario; no agregues componentes "
        "que no estén en la lista.\n\n"
        f"Componentes:\n{components_json}\n\n"
        "Verificá compatibilidad de socket, chipset, BIOS, tipo y velocidad de "
        "memoria, PCIe, alimentación, refrigeración, espacio físico y cableado. "
        "Prestá especial atención a los headers de 3 y 4 pines, a la bomba de un "
        "AIO y al sensor de RPM. Si falta información crítica, indicálo en "
        "warnings y bajá el score. Respondé únicamente con el JSON estricto "
        "solicitado."
    )


# El 429 es cuota agotada (por minuto o por día): reintentar el mismo modelo
# casi nunca ayuda, así que se pasa directo al siguiente. Los 5xx sí se
# reintentan una vez porque suelen ser saturación transitoria.
GEMINI_RETRY_STATUSES = {500, 502, 503, 504}
GEMINI_RETRY_DELAYS = (2,)


def _call_gemini(settings: Settings, user_prompt: str) -> str:
    """Prueba el modelo principal y, si falla, cada modelo de respaldo."""
    if not settings.gemini_api_key:
        raise AIProviderError("GEMINI_API_KEY no está configurada.")

    models = settings.gemini_models
    if not models:
        raise AIProviderError("GEMINI_MODEL no está configurado.")

    payload = {
        "systemInstruction": {"parts": [{"text": SYSTEM_PROMPT}]},
        "contents": [
            {
                "role": "user",
                "parts": [{"text": user_prompt}],
            }
        ],
        "generationConfig": {
            "temperature": 0.2,
            "maxOutputTokens": 8192,
            "responseMimeType": "application/json",
            "responseSchema": GEMINI_RESPONSE_SCHEMA,
        },
    }

    failures: list[str] = []

    for model in models:
        url = (
            "https://generativelanguage.googleapis.com/v1beta/models/"
            f"{model}:generateContent"
        )
        response: httpx.Response | None = None

        for attempt in range(len(GEMINI_RETRY_DELAYS) + 1):
            try:
                response = httpx.post(
                    url,
                    headers={"x-goog-api-key": settings.gemini_api_key},
                    json=payload,
                    timeout=settings.ai_timeout_seconds,
                )
            except httpx.HTTPError as exc:
                failures.append(f"{model} → error de conexión: {exc}")
                logger.warning(
                    "No se pudo conectar con Gemini usando %s: %s", model, exc
                )
                response = None
                break

            if (
                response.status_code not in GEMINI_RETRY_STATUSES
                or attempt == len(GEMINI_RETRY_DELAYS)
            ):
                break

            delay = GEMINI_RETRY_DELAYS[attempt]
            logger.warning(
                "Gemini %s respondió HTTP %s; reintento %s/%s en %ss.",
                model,
                response.status_code,
                attempt + 1,
                len(GEMINI_RETRY_DELAYS),
                delay,
            )
            time.sleep(delay)

        if response is None:
            continue

        if response.status_code in (401, 403):
            detail = _safe_provider_detail(response.text, settings.gemini_api_key)
            raise AIProviderError(
                f"Gemini rechazó la API key (HTTP {response.status_code}): {detail}"
            )

        if response.status_code >= 400:
            detail = _gemini_error_detail(response, settings.gemini_api_key)
            failures.append(f"{model} → {detail}")
            logger.warning(
                "Gemini %s falló (%s); probando el siguiente modelo.",
                model,
                detail,
            )
            continue

        try:
            data = response.json()
        except ValueError:
            failures.append(f"{model} → respuesta que no es JSON")
            logger.warning("Gemini %s devolvió una respuesta que no es JSON.", model)
            continue

        candidates = data.get("candidates") or []
        if not candidates:
            feedback = data.get("promptFeedback") or {}
            failures.append(f"{model} → sin candidatos ({feedback})")
            logger.warning("Gemini %s no devolvió candidatos: %s", model, feedback)
            continue

        candidate = candidates[0]
        parts = (candidate.get("content") or {}).get("parts") or []
        text = "".join(
            part.get("text", "")
            for part in parts
            if isinstance(part, dict) and not part.get("thought", False)
        ).strip()

        if not text:
            finish_reason = candidate.get("finishReason", "desconocido")
            failures.append(f"{model} → sin texto (finishReason={finish_reason})")
            logger.warning(
                "Gemini %s no devolvió texto (finishReason=%s).",
                model,
                finish_reason,
            )
            continue

        try:
            _parse_ai_response(text)
        except AIProviderError as exc:
            failures.append(f"{model} → JSON inválido: {exc}")
            logger.warning(
                "Gemini %s devolvió un JSON inválido; probando el siguiente modelo: %s",
                model,
                exc,
            )
            continue

        if model != models[0]:
            logger.warning(
                "Gemini respondió con el modelo de respaldo %s (el principal %s falló).",
                model,
                models[0],
            )
        else:
            logger.info("Gemini respondió con el modelo principal %s.", model)

        return text

    detail = "; ".join(failures) if failures else "sin detalle"
    raise AIProviderError(
        "Todos los modelos de Gemini están saturados o sin cuota disponible. "
        f"Intentos: {detail}"
    )


def _gemini_error_detail(response: httpx.Response, api_key: str) -> str:
    """Resume el error de Gemini sin exponer la clave ni volcar todo el body."""
    message = ""

    try:
        payload = response.json()
        error = payload.get("error") or {}
        message = str(error.get("message") or "")
    except ValueError:
        message = response.text

    message = _safe_provider_detail(message, api_key)
    if len(message) > 180:
        message = f"{message[:180]}…"

    return f"HTTP {response.status_code}" + (f": {message}" if message else "")


def _call_deepseek(settings: Settings, user_prompt: str) -> str:
    if not settings.deepseek_api_key:
        raise AIProviderError("DEEPSEEK_API_KEY no está configurada.")

    try:
        client = OpenAI(
            api_key=settings.deepseek_api_key,
            base_url=settings.deepseek_base_url,
            timeout=settings.ai_timeout_seconds,
        )
        response = client.chat.completions.create(
            model=settings.deepseek_model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
            max_tokens=4096,
        )
    except Exception as exc:
        raise AIProviderError(f"Error al llamar a DeepSeek: {exc}") from exc

    content = response.choices[0].message.content if response.choices else None
    if not content:
        raise AIProviderError("DeepSeek no devolvió contenido.")
    return content


def _call_openai(settings: Settings, user_prompt: str) -> str:
    if not settings.openai_api_key:
        raise AIProviderError("OPENAI_API_KEY no está configurada.")
    if not settings.openai_model:
        raise AIProviderError("OPENAI_MODEL no está configurado.")

    try:
        client = OpenAI(
            api_key=settings.openai_api_key,
            base_url=settings.openai_base_url,
            timeout=settings.ai_timeout_seconds,
        )
        response = client.chat.completions.create(
            model=settings.openai_model,
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            response_format={"type": "json_object"},
            temperature=0.2,
            max_tokens=4096,
        )
    except Exception as exc:
        raise AIProviderError(f"Error al llamar a OpenAI: {exc}") from exc

    content = response.choices[0].message.content if response.choices else None
    if not content:
        raise AIProviderError("OpenAI no devolvió contenido.")
    return content


def _call_anthropic(settings: Settings, user_prompt: str) -> str:
    if not settings.anthropic_api_key:
        raise AIProviderError("ANTHROPIC_API_KEY no está configurada.")
    if not settings.anthropic_model:
        raise AIProviderError("ANTHROPIC_MODEL no está configurado.")

    try:
        client = Anthropic(
            api_key=settings.anthropic_api_key,
            timeout=settings.ai_timeout_seconds,
        )
        response = client.messages.create(
            model=settings.anthropic_model,
            max_tokens=4096,
            temperature=0.2,
            system=SYSTEM_PROMPT,
            messages=[{"role": "user", "content": user_prompt}],
        )
    except Exception as exc:
        raise AIProviderError(f"Error al llamar a Anthropic: {exc}") from exc

    content = "".join(
        block.text
        for block in response.content
        if getattr(block, "type", None) == "text"
    ).strip()
    if not content:
        raise AIProviderError("Anthropic no devolvió contenido de texto.")
    return content


def _parse_ai_response(raw_response: str) -> BuildValidationResult:
    json_text = _extract_json(raw_response)

    try:
        payload = json.loads(json_text)
    except json.JSONDecodeError as exc:
        raise AIProviderError("El proveedor devolvió un JSON inválido.") from exc

    if not isinstance(payload, dict):
        raise AIProviderError("El proveedor no devolvió un objeto JSON.")

    try:
        score = int(payload["compatibility_score"])
    except (KeyError, TypeError, ValueError) as exc:
        raise AIProviderError(
            "El JSON no contiene un compatibility_score válido."
        ) from exc
    payload["compatibility_score"] = max(0, min(100, score))

    warnings = payload.get("warnings", [])
    if warnings is None:
        warnings = []
    if not isinstance(warnings, list):
        raise AIProviderError("El campo warnings debe ser una lista de textos.")
    payload["warnings"] = [
        str(warning).strip() for warning in warnings if str(warning).strip()
    ]

    feedback = payload.get("detailed_feedback")
    if not isinstance(feedback, str) or not feedback.strip():
        raise AIProviderError(
            "El campo detailed_feedback debe ser un texto no vacío."
        )
    payload["detailed_feedback"] = feedback.strip()

    try:
        return BuildValidationResult.model_validate(payload)
    except ValidationError as exc:
        raise AIProviderError(
            f"El JSON del proveedor no cumple el esquema: {exc}"
        ) from exc


def _extract_json(text: str) -> str:
    """Quita fences de markdown y recorta el primer objeto JSON encontrado."""
    cleaned = text.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
        cleaned = re.sub(r"\s*```$", "", cleaned)

    start = cleaned.find("{")
    end = cleaned.rfind("}")
    if start == -1 or end == -1 or end <= start:
        raise AIProviderError("El proveedor no devolvió un objeto JSON.")

    return cleaned[start : end + 1]


def _safe_provider_detail(text: str, api_key: str) -> str:
    """Recorta errores del proveedor y evita filtrar la API key."""
    detail = text.strip().replace(api_key, "[REDACTED]")
    return detail[:500]
