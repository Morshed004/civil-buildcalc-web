import type { ReactNode, SVGProps } from "react";
import type { IconName } from "@/lib/tools";

interface IconProps {
  size?: number;
  className?: string;
}

const base: SVGProps<SVGSVGElement> = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round",
  strokeLinejoin: "round",
};

export function ArrowLeftIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true" {...base}>
      <path d="M19 12H5M11 6l-6 6 6 6" />
    </svg>
  );
}

export function ArrowRightIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true" {...base}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export function SearchIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" className={className} aria-hidden="true" {...base}>
      <circle cx="11" cy="11" r="7" />
      <path d="M20 20l-3.5-3.5" />
    </svg>
  );
}

const TOOL_PATHS: Record<IconName, ReactNode> = {
  concrete: (<><path d="M3 9l9-4 9 4v9l-9 4-9-4V9z" /><path d="M3 9l9 4 9-4M12 13v9" /></>),
  rod: (<><path d="M4 20L20 4" /><path d="M7 17l2 2M10 14l2 2M13 11l2 2M16 8l2 2" /></>),
  pile: (<><path d="M4 3h16M6 3v15l6 3 6-3V3" /><path d="M9 7v10M15 7v10" /></>),
  beam: (<><rect x="2" y="9" width="20" height="6" /><path d="M6 9v6M10 9v6M14 9v6M18 9v6" /></>),
  column: (<><rect x="8" y="2" width="8" height="20" /><path d="M8 6h8M8 10h8M8 14h8M8 18h8" /></>),
  brick: (<><rect x="2" y="5" width="20" height="14" /><path d="M2 12h20M8 5v7M16 12v7" /></>),
  plaster: (<><path d="M3 21h18" /><path d="M5 17l7-12 7 12" /><path d="M8 12h8" /></>),
  slab: (<><path d="M2 10h20v4H2z" /><path d="M2 7h20M5 14v3M11 14v3M17 14v3" /></>),
  footing: (<><path d="M3 6h18v4H3z" /><path d="M7 10l-2 8h14l-2-8" /></>),
  stair: (<><path d="M3 20h4v-4h4v-4h4V8h4V4h2v16H3z" /></>),
  lintel: (<><path d="M3 8h18v4H3z" /><path d="M5 12v8M19 12v8M7 8V4h10v4" /></>),
  excavation: (<><path d="M3 18h18" /><path d="M5 18l3-8h8l3 8" /><path d="M9 10V5h6v5" /></>),
  fill: (<><path d="M3 18c3-2 6 2 9 0s6-2 9 0" /><path d="M3 13c3-2 6 2 9 0s6-2 9 0" /><path d="M12 3v7M9 7l3 3 3-3" /></>),
  tile: (<><rect x="3" y="3" width="18" height="18" /><path d="M3 12h18M12 3v18" /></>),
  paint: (<><path d="M4 4h12v5H4z" /><path d="M16 6h3v6h-7v3" /><path d="M12 14v6" /></>),
  bend: (<><path d="M4 20V10a6 6 0 0 1 6-6h10" /><path d="M20 4v4" /></>),
  convert: (<><path d="M4 8h14l-3-3M20 16H6l3 3" /></>),
  lap: (<><path d="M3 8h12M9 16h12" /><path d="M15 8v8" /></>),
};

/** Tool icons used on homepage cards. */
export function ToolIcon({ name, size = 28 }: { name: IconName; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" {...base}>
      {TOOL_PATHS[name]}
    </svg>
  );
}
