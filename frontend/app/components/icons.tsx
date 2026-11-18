import type { ReactNode } from "react";

type IconProps = {
  className?: string;
};

function Icon({
  className,
  children,
}: IconProps & {
  children: ReactNode;
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.7}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {children}
    </svg>
  );
}

export function CpuIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <rect x="7" y="7" width="10" height="10" rx="2" />
      <rect x="10" y="10" width="4" height="4" rx="0.5" />
      <path d="M9 3v4M15 3v4M9 17v4M15 17v4M3 9h4M3 15h4M17 9h4M17 15h4" />
    </Icon>
  );
}

export function MotherboardIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M7 7h4v4H7zM15 7h2M15 11h2M7 15h2M11 15h6M7 18h10" />
    </Icon>
  );
}

export function RamIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <rect x="3" y="7" width="18" height="9" rx="2" />
      <path d="M7 7v9M11 7v9M15 7v9M19 7v9M6 16v3M10 16v3M14 16v3M18 16v3" />
    </Icon>
  );
}

export function StorageIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <circle cx="12" cy="12" r="3" />
      <path d="M7 4v3M17 4v3M8 17h8" />
    </Icon>
  );
}

export function PsuIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M13 2 4.5 13H11l-1 9L19.5 11H13l1-9Z" />
    </Icon>
  );
}

export function CoolingIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="12" r="9" />
      <circle cx="12" cy="12" r="2.5" />
      <path d="M12 9.5V4M12 14.5V20M9.5 12H4M14.5 12H20M9.2 9.2 5.8 5.8M14.8 14.8l3.4 3.4M14.8 9.2l3.4-3.4M9.2 14.8l-3.4 3.4" />
    </Icon>
  );
}

export function BoxIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="m21 8-9-5-9 5 9 5 9-5Z" />
      <path d="M3 8v8l9 5 9-5V8M12 13v8" />
    </Icon>
  );
}

export function PlusIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M12 5v14M5 12h14" />
    </Icon>
  );
}

export function TrashIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6M10 11v5M14 11v5" />
    </Icon>
  );
}

export function ArrowRightIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </Icon>
  );
}

export function ArrowUpRightIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M7 17 17 7M8 7h9v9" />
    </Icon>
  );
}

export function AlertTriangleIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="m10.3 3.9-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-3.1l-8-14a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4M12 17h.01" />
    </Icon>
  );
}

export function CheckCircleIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <circle cx="12" cy="12" r="9" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </Icon>
  );
}

export function CheckIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="m5 12 4.5 4.5L19 7" />
    </Icon>
  );
}

export function SparklesIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Z" />
      <path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8L19 15Z" />
    </Icon>
  );
}

export function ShieldIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M12 3 5 6v5c0 4.5 3 8 7 10 4-2 7-5.5 7-10V6l-7-3Z" />
      <path d="m9 12 2 2 4-4" />
    </Icon>
  );
}

export function CopyIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <rect x="9" y="9" width="11" height="11" rx="2" />
      <path d="M5 15V5a2 2 0 0 1 2-2h10" />
    </Icon>
  );
}

export function RefreshIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M20 11a8 8 0 1 0-2.3 6.7M20 5v6h-6" />
    </Icon>
  );
}

export function GaugeIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z" />
      <path d="m13.4 10.6 4.6-4.6M3.5 18a9 9 0 1 1 17 0" />
    </Icon>
  );
}

export function FileTextIcon({ className }: IconProps) {
  return (
    <Icon className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6M8 13h8M8 17h5" />
    </Icon>
  );
}
