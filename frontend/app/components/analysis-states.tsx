import { API_BASE_URL } from "@/app/lib/api";
import {
  AlertTriangleIcon,
  GaugeIcon,
} from "./icons";

export function AnalysisLoading() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="relative overflow-hidden rounded-2xl border border-emerald-400/20 bg-[#07100d]/90 p-6 shadow-2xl shadow-black/30 sm:p-8"
    >
      <div className="absolute inset-x-0 top-0 h-px overflow-hidden">
        <div className="h-px w-1/2 animate-scan-x bg-gradient-to-r from-transparent via-emerald-400/80 to-transparent" />
      </div>

      <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
        <div className="relative flex h-16 w-16 shrink-0 items-center justify-center">
          <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/10" />
          <span className="absolute inset-1 rounded-full border border-emerald-400/15" />
          <span className="h-10 w-10 animate-spin rounded-full border-2 border-emerald-400/20 border-t-emerald-400" />
        </div>

        <div>
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-400">
            Ejecutando diagnóstico
          </p>
          <h3 className="mt-1 text-lg font-semibold tracking-tight text-zinc-100">
            Analizando compatibilidad y voltajes...
          </h3>
          <p className="mt-1 text-sm leading-6 text-zinc-400">
            La IA está revisando sockets, memoria, PCIe, alimentación y
            cableado. Esto puede tardar unos segundos.
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-2 sm:grid-cols-3">
        {["Socket y chipset", "Memoria y PCIe", "Energía y headers"].map(
          (label, index) => (
            <div
              key={label}
              className="flex items-center gap-2 rounded-lg border border-white/[0.06] bg-black/20 px-3 py-2.5 text-xs text-zinc-400"
            >
              <span
                className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400"
                style={{ animationDelay: `${index * 160}ms` }}
              />
              {label}
            </div>
          ),
        )}
      </div>

      <div className="mt-5 h-1 overflow-hidden rounded-full bg-white/[0.04]">
        <div className="h-full w-1/3 animate-scan-x rounded-full bg-gradient-to-r from-emerald-400/0 via-emerald-400 to-cyan-400" />
      </div>
    </div>
  );
}

export function ErrorPanel({ message }: { message: string }) {
  const providerBusy = /(503|high demand|saturad|UNAVAILABLE)/i.test(message);

  return (
    <div
      role="alert"
      className="rounded-2xl border border-red-500/25 bg-red-500/[0.05] p-6 shadow-2xl shadow-black/30 sm:p-8"
    >
      <div className="flex flex-col gap-4 sm:flex-row">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-red-400/25 bg-red-400/10 text-red-300">
          <AlertTriangleIcon className="h-5 w-5" />
        </span>

        <div className="min-w-0">
          <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-red-400">
            Análisis interrumpido
          </p>
          <h3 className="mt-1 text-lg font-semibold tracking-tight text-zinc-100">
            No se pudo completar el análisis
          </h3>
          <p className="mt-2 text-sm leading-6 text-red-100/80">
            {providerBusy
              ? "El proveedor de IA está saturado en este momento. Esperá unos segundos y volvé a intentar."
              : message}
          </p>

          {providerBusy ? (
            <details className="mt-3 rounded-lg border border-white/[0.06] bg-black/20">
              <summary className="cursor-pointer px-3 py-2 text-xs text-zinc-500">
                Detalle técnico
              </summary>
              <pre className="max-h-40 overflow-auto whitespace-pre-wrap border-t border-white/[0.06] p-3 font-mono text-[11px] leading-5 text-zinc-500">
                {message}
              </pre>
            </details>
          ) : null}

          <div className="mt-4 rounded-lg border border-white/[0.06] bg-black/20 p-3 font-mono text-[11px] leading-5 text-zinc-500">
            {providerBusy
              ? "El backend respondió, pero Gemini no completó la validación. Reintentá en unos segundos."
              : `Verificá que Uvicorn esté corriendo en ${API_BASE_URL} y que CORS permita el origen del frontend.`}
          </div>
        </div>
      </div>
    </div>
  );
}

export function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.015] px-6 py-10 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-zinc-500">
        <GaugeIcon className="h-5 w-5" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-zinc-300">
        Esperando el primer análisis
      </h3>
      <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-zinc-500">
        Completá los componentes y ejecutá la validación. El resultado aparece
        acá con puntaje, advertencias y diagnóstico técnico.
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        {["Socket", "DDR4 / DDR5", "PCIe", "PSU", "Headers"].map((item) => (
          <span
            key={item}
            className="rounded-full border border-white/[0.06] bg-black/20 px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-500"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
