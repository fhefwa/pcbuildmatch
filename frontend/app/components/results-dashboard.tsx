"use client";

import { useEffect, useRef, useState } from "react";

import type { BuildResult } from "@/app/lib/api";
import {
  AlertTriangleIcon,
  CheckCircleIcon,
  CheckIcon,
  CopyIcon,
  FileTextIcon,
  RefreshIcon,
} from "./icons";

type ResultsDashboardProps = {
  result: BuildResult;
  onReset: () => void;
};

type ScoreTone = {
  label: string;
  title: string;
  description: string;
  text: string;
  stroke: string;
  badge: string;
  glow: string;
};

function getScoreTone(score: number): ScoreTone {
  if (score >= 90) {
    return {
      label: "Compatible",
      title: "Build lista para armar",
      description:
        "No se detectaron incompatibilidades críticas. Revisá igualmente el manual de la placa madre para el cableado fino.",
      text: "text-emerald-400",
      stroke: "#34d399",
      badge: "border-emerald-400/30 bg-emerald-400/10 text-emerald-300",
      glow: "bg-emerald-400/10",
    };
  }

  if (score >= 70) {
    return {
      label: "Requiere atención",
      title: "Hay detalles para revisar",
      description:
        "La base es compatible, pero hay advertencias que conviene resolver antes de comprar o ensamblar.",
      text: "text-amber-400",
      stroke: "#fbbf24",
      badge: "border-amber-400/30 bg-amber-400/10 text-amber-300",
      glow: "bg-amber-400/10",
    };
  }

  return {
    label: "Riesgo alto",
    title: "Incompatibilidad probable",
    description:
      "Se detectaron problemas serios o falta información crítica. No armes la build sin revisar cada advertencia.",
    text: "text-red-400",
    stroke: "#f87171",
    badge: "border-red-400/30 bg-red-400/10 text-red-300",
    glow: "bg-red-400/10",
  };
}

function ScoreGauge({ score, tone }: { score: number; tone: ScoreTone }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setProgress(score));
    return () => cancelAnimationFrame(frame);
  }, [score]);

  return (
    <div className="relative h-40 w-40 shrink-0">
      <div className="absolute inset-3 rounded-full border border-white/[0.04]" />
      <svg viewBox="0 0 140 140" className="h-full w-full -rotate-90">
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="9"
          className="text-white/[0.06]"
        />
        <circle
          cx="70"
          cy="70"
          r={radius}
          fill="none"
          stroke={tone.stroke}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circumference}
          style={{
            strokeDashoffset: circumference * (1 - progress / 100),
            transition:
              "stroke-dashoffset 900ms cubic-bezier(0.22, 1, 0.36, 1)",
            filter: `drop-shadow(0 0 8px ${tone.stroke}66)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className={`font-mono text-4xl font-bold tabular-nums ${tone.text}`}
        >
          {score}
        </span>
        <span className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.2em] text-zinc-500">
          / 100
        </span>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-lg border border-white/[0.06] bg-black/20 px-3 py-2">
      <p className="font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-500">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-semibold text-zinc-200">{value}</p>
    </div>
  );
}

export function ResultsDashboard({
  result,
  onReset,
}: ResultsDashboardProps) {
  const tone = getScoreTone(result.compatibility_score);
  const [copied, setCopied] = useState(false);
  const copyTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimeout.current) {
        clearTimeout(copyTimeout.current);
      }
    };
  }, []);

  const createdAt = new Date(result.created_at);
  const formattedDate = Number.isNaN(createdAt.getTime())
    ? result.created_at
    : new Intl.DateTimeFormat("es-AR", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(createdAt);

  async function copyToClipboard(text: string) {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // El navegador puede bloquear la Clipboard API; se usa el fallback.
      }
    }

    let textarea: HTMLTextAreaElement | null = null;

    try {
      textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.setAttribute("readonly", "");
      textarea.style.position = "fixed";
      textarea.style.top = "-9999px";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      return document.execCommand("copy");
    } catch {
      return false;
    } finally {
      textarea?.remove();
    }
  }

  async function handleCopy() {
    const report = [
      `PCBuildMatch — Build #${result.id}`,
      `Puntaje de compatibilidad: ${result.compatibility_score}/100`,
      `Componentes analizados: ${result.components_json.length}`,
      "",
      "Advertencias de ensamblaje:",
      ...(result.warnings.length > 0
        ? result.warnings.map((warning) => `- ${warning}`)
        : ["Sin advertencias."]),
      "",
      "Diagnóstico técnico:",
      result.detailed_feedback,
    ].join("\n");

    const copiedSuccessfully = await copyToClipboard(report);
    setCopied(copiedSuccessfully);

    if (copiedSuccessfully) {
      if (copyTimeout.current) {
        clearTimeout(copyTimeout.current);
      }

      copyTimeout.current = setTimeout(() => setCopied(false), 2200);
    }
  }

  return (
    <section className="animate-fade-up" aria-labelledby="results-title">
      <p className="sr-only" role="status">
        Análisis completado. Puntaje de compatibilidad:{" "}
        {result.compatibility_score} sobre 100. {result.warnings.length}{" "}
        advertencias detectadas.
      </p>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
            <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-400">
              Análisis completado
            </p>
          </div>
          <h2
            id="results-title"
            className="mt-2 text-2xl font-semibold tracking-tight text-zinc-100"
          >
            Diagnóstico de compatibilidad
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Build #{result.id} · {formattedDate}
          </p>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3.5 py-2 text-xs font-medium text-zinc-300 transition hover:border-emerald-400/30 hover:text-emerald-300"
        >
          <RefreshIcon className="h-3.5 w-3.5" />
          Validar otra build
        </button>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[0.92fr_1.08fr]">
        <div className="relative overflow-hidden rounded-2xl border border-white/[0.07] bg-[#080d12]/90 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-6">
          <div
            className={`pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full blur-3xl ${tone.glow}`}
          />

          <div className="relative flex flex-col items-center gap-5 sm:flex-row sm:items-center">
            <ScoreGauge score={result.compatibility_score} tone={tone} />

            <div className="min-w-0 flex-1 text-center sm:text-left">
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-1 font-mono text-[10px] uppercase tracking-[0.14em] ${tone.badge}`}
              >
                {tone.label}
              </span>
              <h3 className="mt-3 text-xl font-semibold tracking-tight text-zinc-100">
                {tone.title}
              </h3>
              <p className="mt-2 text-sm leading-6 text-zinc-400">
                {tone.description}
              </p>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <Stat label="Puntaje" value={`${result.compatibility_score}/100`} />
                <Stat label="Alertas" value={result.warnings.length} />
                <Stat label="Piezas" value={result.components_json.length} />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-white/[0.07] bg-[#080d12]/90 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-amber-400/20 bg-amber-400/[0.06] text-amber-300">
                <AlertTriangleIcon className="h-4 w-4" />
              </span>
              <div>
                <h3 className="text-sm font-semibold text-zinc-100">
                  Advertencias de ensamblaje
                </h3>
                <p className="text-xs text-zinc-500">
                  Conexiones, potencia y compatibilidad
                </p>
              </div>
            </div>
            <span className="rounded-full border border-white/[0.08] bg-black/20 px-2.5 py-1 font-mono text-[10px] text-zinc-400">
              {result.warnings.length}
            </span>
          </div>

          {result.warnings.length === 0 ? (
            <div className="mt-5 flex items-center gap-3 rounded-xl border border-emerald-400/15 bg-emerald-400/[0.04] p-4">
              <CheckCircleIcon className="h-5 w-5 shrink-0 text-emerald-400" />
              <p className="text-sm leading-6 text-emerald-100/80">
                No se detectaron advertencias de ensamblaje.
              </p>
            </div>
          ) : (
            <ul className="mt-5 max-h-[19rem] space-y-2.5 overflow-y-auto pr-1 scrollbar-thin">
              {result.warnings.map((warning, index) => (
                <li
                  key={`${index}-${warning.slice(0, 24)}`}
                  className="flex gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5"
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-400/10 font-mono text-[10px] font-semibold text-amber-300">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <p className="text-sm leading-6 text-zinc-300">{warning}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/[0.07] bg-[#080d12]/90 p-5 shadow-2xl shadow-black/30 backdrop-blur-xl sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg border border-cyan-400/20 bg-cyan-400/[0.06] text-cyan-300">
              <FileTextIcon className="h-4 w-4" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100">
                Diagnóstico técnico
              </h3>
              <p className="text-xs text-zinc-500">
                Explicación del veredicto y pasos recomendados
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-2 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-zinc-400 transition hover:border-cyan-400/30 hover:text-cyan-300"
          >
            {copied ? (
              <CheckIcon className="h-3.5 w-3.5" />
            ) : (
              <CopyIcon className="h-3.5 w-3.5" />
            )}
            {copied ? "Copiado" : "Copiar informe"}
          </button>
        </div>

        <div className="mt-4 rounded-xl border border-white/[0.06] bg-black/25 p-4 sm:p-5">
          <p className="whitespace-pre-line text-sm leading-7 text-zinc-300">
            {result.detailed_feedback}
          </p>
        </div>
      </div>
    </section>
  );
}
