"use client";

import {
  useState,
  type ComponentType,
  type FormEvent,
} from "react";

import type { ComponentInput } from "@/app/lib/api";
import {
  AlertTriangleIcon,
  ArrowRightIcon,
  BoxIcon,
  CoolingIcon,
  CpuIcon,
  MotherboardIcon,
  PlusIcon,
  PsuIcon,
  RamIcon,
  ShieldIcon,
  SparklesIcon,
  StorageIcon,
  TrashIcon,
} from "./icons";

type IconComponent = ComponentType<{ className?: string }>;

type ComponentDef = {
  key: string;
  type: string;
  label: string;
  code: string;
  placeholder: string;
  icon: IconComponent;
};

type BuildField = {
  id: string;
  type: string;
  value: string;
  fixed: boolean;
  label: string;
  code: string;
  placeholder: string;
  icon: IconComponent;
};

type BuildFormProps = {
  isLoading: boolean;
  onSubmit: (components: ComponentInput[]) => void | Promise<void>;
};

const COMPONENT_DEFS: ComponentDef[] = [
  {
    key: "cpu",
    type: "CPU",
    label: "Procesador",
    code: "CPU",
    placeholder: "Ryzen 7 9800X3D · AM5 · 120 W",
    icon: CpuIcon,
  },
  {
    key: "motherboard",
    type: "Motherboard",
    label: "Placa madre",
    code: "MB",
    placeholder: "MSI B650 TOMAHAWK WIFI · AM5 · DDR5",
    icon: MotherboardIcon,
  },
  {
    key: "ram",
    type: "RAM",
    label: "Memoria RAM",
    code: "RAM",
    placeholder: "32 GB DDR5-6000 CL30 (2×16 GB)",
    icon: RamIcon,
  },
  {
    key: "storage",
    type: "Storage",
    label: "Almacenamiento",
    code: "SSD",
    placeholder: "990 PRO 2 TB · NVMe PCIe 4.0",
    icon: StorageIcon,
  },
  {
    key: "psu",
    type: "PSU",
    label: "Fuente",
    code: "PSU",
    placeholder: "RM850x 850 W · Gold · ATX 3.0",
    icon: PsuIcon,
  },
  {
    key: "cooling",
    type: "Cooling",
    label: "Refrigeración",
    code: "AIO",
    placeholder: "Liquid Freezer III 360 · AM5",
    icon: CoolingIcon,
  },
];

const EXAMPLE_VALUES: Record<string, string> = {
  CPU: "AMD Ryzen 7 9800X3D · socket AM5 · 120 W",
  Motherboard:
    "MSI MAG B650 TOMAHAWK WIFI · AM5 · DDR5 · headers CPU_FAN, AIO_PUMP y SYS_FAN",
  RAM: "G.Skill Flare X5 32 GB (2×16 GB) DDR5-6000 CL30 EXPO",
  Storage: "Samsung 990 PRO 2 TB · NVMe PCIe 4.0",
  PSU: "Corsair RM850x 850 W · 80 Plus Gold · ATX 3.0 · 1× 12VHPWR",
  Cooling:
    "Arctic Liquid Freezer III 360 ARGB · AM5 · bomba 3 pines + ventiladores 4 pines PWM · radiador 360 mm",
};

function createInitialFields(): BuildField[] {
  return COMPONENT_DEFS.map((definition) => ({
    id: definition.key,
    type: definition.type,
    value: "",
    fixed: true,
    label: definition.label,
    code: definition.code,
    placeholder: definition.placeholder,
    icon: definition.icon,
  }));
}

export function BuildForm({ isLoading, onSubmit }: BuildFormProps) {
  const [fields, setFields] = useState<BuildField[]>(createInitialFields);
  const [formError, setFormError] = useState<string | null>(null);

  const filledCount = fields.filter((field) => field.value.trim()).length;

  function updateField(id: string, value: string) {
    setFields((current) =>
      current.map((field) => (field.id === id ? { ...field, value } : field)),
    );

    if (formError) {
      setFormError(null);
    }
  }

  function updateCustomType(id: string, type: string) {
    setFields((current) =>
      current.map((field) => (field.id === id ? { ...field, type } : field)),
    );

    if (formError) {
      setFormError(null);
    }
  }

  function addCustomField() {
    setFields((current) => [
      ...current,
      {
        id: `custom-${Date.now()}-${current.length}`,
        type: "",
        value: "",
        fixed: false,
        label: "Componente adicional",
        code: "EXTRA",
        placeholder: "Ej: NVIDIA RTX 4070 Super · 12 GB · 300 mm · 1× 12VHPWR",
        icon: BoxIcon,
      },
    ]);
  }

  function removeField(id: string) {
    setFields((current) => current.filter((field) => field.id !== id));
  }

  function loadExample() {
    setFields((current) =>
      current.map((field) =>
        field.fixed
          ? { ...field, value: EXAMPLE_VALUES[field.type] ?? "" }
          : field,
      ),
    );
    setFormError(null);
  }

  function clearForm() {
    setFields(createInitialFields());
    setFormError(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLoading) {
      return;
    }

    const components: ComponentInput[] = fields
      .map((field) => ({
        type: field.type.trim() || "Otro",
        model: field.value.trim(),
      }))
      .filter((component) => component.model.length > 0);

    if (components.length === 0) {
      setFormError(
        "Agregá al menos un componente para que la IA pueda analizar la build.",
      );
      return;
    }

    setFormError(null);
    void onSubmit(components);
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-busy={isLoading}
      className="relative z-10 rounded-2xl border border-white/[0.07] bg-[#080d12]/90 shadow-2xl shadow-black/40 backdrop-blur-xl"
    >
      <div className="flex flex-col gap-4 border-b border-white/[0.06] p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
        <div className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-400/20 bg-emerald-400/[0.06] font-mono text-xs font-semibold text-emerald-300">
            01
          </span>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold tracking-tight text-zinc-100">
                Componentes del ensamblaje
              </h2>
              <span className="rounded-full border border-white/[0.08] bg-black/20 px-2 py-0.5 font-mono text-[10px] text-zinc-500">
                {filledCount}/{fields.length}
              </span>
            </div>
            <p className="mt-1 max-w-xl text-xs leading-5 text-zinc-500">
              Describí marca, modelo y especificaciones relevantes. Cuanto más
              detalle, más preciso el diagnóstico de sockets, potencia y
              cableado.
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2 pl-12 sm:pl-0">
          <button
            type="button"
            onClick={loadExample}
            disabled={isLoading}
            className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-zinc-300 transition hover:border-emerald-400/30 hover:text-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cargar ejemplo
          </button>
          <button
            type="button"
            onClick={clearForm}
            disabled={isLoading}
            className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-zinc-500 transition hover:text-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Limpiar
          </button>
        </div>
      </div>

      <div className="p-5 sm:p-6">
        <div className="grid gap-3 sm:grid-cols-2">
          {fields.map((field) => {
            const FieldIcon = field.icon;

            if (!field.fixed) {
              return (
                <div
                  key={field.id}
                  className="rounded-xl border border-emerald-400/20 bg-emerald-400/[0.02] p-3.5 sm:col-span-2"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-emerald-400/80">
                      <FieldIcon className="h-4 w-4" />
                    </span>
                    <input
                      type="text"
                      value={field.type}
                      onChange={(event) =>
                        updateCustomType(field.id, event.target.value)
                      }
                      placeholder="Tipo de componente (GPU, ventiladores...)"
                      aria-label="Tipo de componente adicional"
                      autoComplete="off"
                      spellCheck={false}
                      className="min-w-0 flex-1 bg-transparent text-sm font-medium text-zinc-100 placeholder:text-zinc-600 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => removeField(field.id)}
                      aria-label="Quitar componente adicional"
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-zinc-600 transition hover:bg-red-400/10 hover:text-red-300"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                  <input
                    type="text"
                    value={field.value}
                    onChange={(event) =>
                      updateField(field.id, event.target.value)
                    }
                    placeholder={field.placeholder}
                    aria-label="Descripción del componente adicional"
                    autoComplete="off"
                    spellCheck={false}
                    className="mt-3 w-full bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
                  />
                </div>
              );
            }

            return (
              <label
                key={field.id}
                className="group block cursor-text rounded-xl border border-white/[0.07] bg-white/[0.02] p-3.5 transition-colors focus-within:border-emerald-400/30 focus-within:bg-emerald-400/[0.025] hover:border-white/[0.12]"
              >
                <div className="flex items-center gap-2.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-zinc-500 transition-colors group-focus-within:text-emerald-400">
                    <FieldIcon className="h-4 w-4" />
                  </span>
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-400">
                    {field.label}
                  </span>
                  <span className="ml-auto font-mono text-[9px] uppercase tracking-[0.16em] text-zinc-600">
                    {field.code}
                  </span>
                </div>
                <input
                  type="text"
                  value={field.value}
                  onChange={(event) =>
                    updateField(field.id, event.target.value)
                  }
                  placeholder={field.placeholder}
                  autoComplete="off"
                  spellCheck={false}
                  className="mt-3 w-full bg-transparent text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none"
                />
              </label>
            );
          })}
        </div>

        <button
          type="button"
          onClick={addCustomField}
          disabled={isLoading}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-white/10 px-4 py-3 text-sm font-medium text-zinc-400 transition hover:border-emerald-400/30 hover:bg-emerald-400/[0.03] hover:text-emerald-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <PlusIcon className="h-4 w-4" />
          Agregar otro componente
        </button>

        {formError ? (
          <p
            className="mt-3 flex items-center gap-2 text-sm text-red-300"
            role="alert"
          >
            <AlertTriangleIcon className="h-4 w-4 shrink-0" />
            {formError}
          </p>
        ) : null}

        <div className="mt-5 flex flex-col gap-4 border-t border-white/[0.06] pt-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <ShieldIcon className="h-4 w-4 shrink-0 text-emerald-400/70" />
            <span>Las claves de IA nunca salen del backend.</span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            aria-busy={isLoading}
            className="group inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-400 to-cyan-400 px-5 py-3 text-sm font-semibold text-[#04120c] shadow-[0_0_28px_-8px_rgba(52,211,153,0.6)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#05070a] disabled:cursor-wait disabled:opacity-70 sm:w-auto"
          >
            {isLoading ? (
              <>
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-[#04120c]/30 border-t-[#04120c]"
                  aria-hidden="true"
                />
                Analizando...
              </>
            ) : (
              <>
                <SparklesIcon className="h-4 w-4" />
                Validar Ensamblaje
                <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </>
            )}
          </button>
        </div>
      </div>
    </form>
  );
}
