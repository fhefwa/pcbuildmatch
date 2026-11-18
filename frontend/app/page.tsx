"use client";

import { useEffect, useRef, useState } from "react";

import {
  AnalysisLoading,
  EmptyState,
  ErrorPanel,
} from "@/app/components/analysis-states";
import { BuildForm } from "@/app/components/build-form";
import { ResultsDashboard } from "@/app/components/results-dashboard";
import {
  API_BASE_URL,
  validateBuild,
  type BuildResult,
  type ComponentInput,
} from "@/app/lib/api";
import {
  ArrowUpRightIcon,
  CheckIcon,
  CoolingIcon,
  CpuIcon,
  PsuIcon,
  RamIcon,
  ShieldIcon,
  SparklesIcon,
  StorageIcon,
} from "@/app/components/icons";

const VALIDATION_CHECKS = [
  {
    icon: CpuIcon,
    title: "Socket y chipset",
    description: "AM4, AM5, LGA1700, generación y soporte de BIOS.",
  },
  {
    icon: RamIcon,
    title: "Memoria y velocidad",
    description: "DDR4/DDR5, canales, EXPO/XMP y límites del controlador.",
  },
  {
    icon: StorageIcon,
    title: "PCIe y almacenamiento",
    description: "M.2, SATA, lanes disponibles y espacio físico.",
  },
  {
    icon: PsuIcon,
    title: "Potencia y conectores",
    description: "Watts reales, EPS, PCIe, 12VHPWR y protecciones.",
  },
  {
    icon: CoolingIcon,
    title: "Refrigeración y espacio",
    description: "TDP, altura del disipador, radiador y clearance.",
  },
  {
    icon: ShieldIcon,
    title: "Cableado y headers",
    description: "3/4 pines, AIO_PUMP, sensor tach, PWM y pin 1.",
  },
];

const SCORE_LEGEND = [
  { color: "bg-emerald-400", range: "90–100", label: "Build sólida" },
  { color: "bg-amber-400", range: "70–89", label: "Revisar detalles" },
  { color: "bg-red-400", range: "0–69", label: "Riesgo alto" },
];

export default function Home() {
  const [result, setResult] = useState<BuildResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const resultsRef = useRef<HTMLDivElement | null>(null);
  const formRef = useRef<HTMLDivElement | null>(null);
  const submittingRef = useRef(false);

  useEffect(() => {
    if (isLoading || result || error) {
      resultsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [isLoading, result, error]);

  async function handleValidate(components: ComponentInput[]) {
    if (submittingRef.current) {
      return;
    }

    submittingRef.current = true;
    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await validateBuild(components);
      setResult(data);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Ocurrió un error inesperado al validar la build.",
      );
    } finally {
      submittingRef.current = false;
      setIsLoading(false);
    }
  }

  function handleReset() {
    setResult(null);
    setError(null);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div
      id="top"
      className="relative flex min-h-screen flex-col overflow-x-hidden bg-[#05070a] text-zinc-100"
    >
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute inset-0 bg-grid" />
        <div className="absolute -top-48 left-1/2 h-[520px] w-[900px] -translate-x-1/2 rounded-full bg-emerald-500/[0.07] blur-[120px]" />
        <div className="absolute right-[-10%] top-[30%] h-[420px] w-[420px] rounded-full bg-cyan-500/[0.05] blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] h-[360px] w-[520px] rounded-full bg-emerald-500/[0.04] blur-[110px]" />
      </div>

      <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#05070a]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-3.5 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-400/25 bg-emerald-400/10 text-emerald-400">
              <span className="absolute inset-0 rounded-xl bg-emerald-400/10 blur-md" />
              <CpuIcon className="relative h-4 w-4" />
            </span>
            <span>
              <span className="block text-sm font-semibold tracking-tight text-zinc-100">
                PCBuildMatch
              </span>
              <span className="block font-mono text-[9px] uppercase tracking-[0.2em] text-zinc-500">
                Hardware intelligence
              </span>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <span className="hidden items-center gap-2 rounded-full border border-emerald-400/15 bg-emerald-400/[0.04] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-emerald-300 sm:inline-flex">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-400" />
              IA online
            </span>
            <a
              href={`${API_BASE_URL}/docs`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-zinc-400 transition hover:border-cyan-400/30 hover:text-cyan-300"
            >
              API docs
              <ArrowUpRightIcon className="h-3 w-3" />
            </a>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto w-full max-w-7xl flex-1 px-5 pb-20 pt-10 sm:px-8 sm:pt-14">
        <section className="max-w-4xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/[0.06] px-3 py-1.5">
            <SparklesIcon className="h-3.5 w-3.5 text-emerald-400" />
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-emerald-300">
              Diagnóstico asistido por IA
            </span>
          </div>

          <h1 className="mt-5 max-w-4xl text-balance text-4xl font-semibold leading-[1.05] tracking-tight text-zinc-100 sm:text-5xl lg:text-6xl">
            Tu build, validada{" "}
            <span className="bg-gradient-to-r from-emerald-300 via-emerald-400 to-cyan-400 bg-clip-text text-transparent">
              antes del primer arranque.
            </span>
          </h1>

          <p className="mt-5 max-w-2xl text-base leading-7 text-zinc-400 sm:text-lg">
            Describí tus componentes y la IA revisa sockets, memoria, PCIe,
            potencia y cableado. Detectá incompatibilidades y conexiones
            riesgosas antes de armar.
          </p>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 font-mono text-[10px] uppercase tracking-[0.14em] text-zinc-500">
            <span className="flex items-center gap-1.5">
              <CheckIcon className="h-3.5 w-3.5 text-emerald-400" />
              Socket + chipset
            </span>
            <span className="flex items-center gap-1.5">
              <CheckIcon className="h-3.5 w-3.5 text-emerald-400" />
              Memoria + PCIe
            </span>
            <span className="flex items-center gap-1.5">
              <CheckIcon className="h-3.5 w-3.5 text-emerald-400" />
              Energía + cableado
            </span>
          </div>
        </section>

        <div className="mt-10 grid items-start gap-5 lg:grid-cols-[1.08fr_0.92fr]">
          <div ref={formRef} className="scroll-mt-24">
            <BuildForm isLoading={isLoading} onSubmit={handleValidate} />
          </div>

          <aside className="lg:sticky lg:top-24">
            <div className="rounded-2xl border border-white/[0.07] bg-[#080d12]/80 p-5 backdrop-blur-xl sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyan-400">
                    Protocolo
                  </p>
                  <h2 className="mt-1 text-base font-semibold tracking-tight text-zinc-100">
                    Qué revisa la IA
                  </h2>
                </div>
                <span className="rounded-full border border-cyan-400/20 bg-cyan-400/[0.06] px-2.5 py-1 font-mono text-[9px] uppercase tracking-[0.14em] text-cyan-300">
                  6 capas
                </span>
              </div>

              <ul className="mt-5 space-y-4">
                {VALIDATION_CHECKS.map((check) => {
                  const CheckIcon = check.icon;

                  return (
                    <li key={check.title} className="flex gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.02] text-zinc-400">
                        <CheckIcon className="h-4 w-4" />
                      </span>
                      <div>
                        <p className="text-sm font-medium text-zinc-200">
                          {check.title}
                        </p>
                        <p className="mt-0.5 text-xs leading-5 text-zinc-500">
                          {check.description}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-6 rounded-xl border border-white/[0.06] bg-black/20 p-4">
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-zinc-500">
                  Escala de compatibilidad
                </p>
                <div className="mt-3 space-y-2.5">
                  {SCORE_LEGEND.map((item) => (
                    <div
                      key={item.range}
                      className="flex items-center gap-2.5 text-xs"
                    >
                      <span
                        className={`h-2 w-2 rounded-full ${item.color}`}
                      />
                      <span className="w-14 font-mono text-[10px] text-zinc-400">
                        {item.range}
                      </span>
                      <span className="text-zinc-500">{item.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <p className="mt-3 px-1 text-center text-[11px] leading-5 text-zinc-600 lg:text-left">
              El puntaje es orientativo. Verificá siempre el manual de tu placa
              madre y las especificaciones del fabricante.
            </p>
          </aside>
        </div>

        <div ref={resultsRef} className="mt-8 scroll-mt-24">
          {isLoading ? (
            <AnalysisLoading />
          ) : error ? (
            <ErrorPanel message={error} />
          ) : result ? (
            <ResultsDashboard result={result} onReset={handleReset} />
          ) : (
            <EmptyState />
          )}
        </div>
      </main>

      <footer className="relative z-10 border-t border-white/[0.06] bg-[#05070a]/60">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-2 px-5 py-6 text-[11px] text-zinc-600 sm:flex-row sm:px-8">
          <p>PCBuildMatch · Diagnóstico de hardware asistido por IA.</p>
          <p className="font-mono uppercase tracking-[0.14em]">
            Verificá siempre el manual de tu placa madre
          </p>
        </div>
      </footer>
    </div>
  );
}
