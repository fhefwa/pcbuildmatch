const configuredApiUrl = process.env.NEXT_PUBLIC_API_URL?.trim();

export const API_BASE_URL = (
  configuredApiUrl || "http://localhost:8000"
).replace(/\/+$/, "");

export type ComponentInput = {
  type: string;
  model: string;
};

export type BuildResult = {
  id: number;
  components_json: ComponentInput[];
  compatibility_score: number;
  warnings: string[];
  detailed_feedback: string;
  created_at: string;
};

type ErrorDetail = {
  msg?: string;
};

type ErrorBody = {
  detail?: string | ErrorDetail[];
};

const REQUEST_TIMEOUT_MS = 120_000;

export async function validateBuild(
  components: ComponentInput[],
): Promise<BuildResult> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}/api/validate-build`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ components }),
      signal: controller.signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(
        "El análisis tardó más de 2 minutos. Intentá de nuevo con menos componentes o revisá la conexión.",
      );
    }

    throw new Error(
      `No se pudo conectar con el backend en ${API_BASE_URL}. Verificá que Uvicorn esté corriendo.`,
    );
  } finally {
    clearTimeout(timeout);
  }

  let body: unknown = null;

  try {
    body = await response.json();
  } catch {
    body = null;
  }

  if (!response.ok) {
    const detail = (body as ErrorBody | null)?.detail;

    if (typeof detail === "string" && detail.trim()) {
      throw new Error(detail);
    }

    if (Array.isArray(detail)) {
      const messages = detail
        .map((item) => item?.msg)
        .filter(
          (message): message is string =>
            typeof message === "string" && message.length > 0,
        );

      if (messages.length > 0) {
        throw new Error(messages.join(" · "));
      }
    }

    throw new Error(`El backend respondió HTTP ${response.status}.`);
  }

  if (!body || typeof body !== "object") {
    throw new Error("El backend devolvió una respuesta vacía o inválida.");
  }

  return body as BuildResult;
}
