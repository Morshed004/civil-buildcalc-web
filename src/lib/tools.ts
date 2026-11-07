import { GENERIC_SPECS } from "@/specs/allSpecs";

export type IconName =
  | "concrete"
  | "rod"
  | "pile"
  | "beam"
  | "column"
  | "brick"
  | "plaster"
  | "slab"
  | "footing"
  | "stair"
  | "lintel"
  | "excavation"
  | "fill"
  | "tile"
  | "paint"
  | "bend"
  | "convert"
  | "lap";

export interface ToolDefinition {
  id: string;
  title: string;
  description: string;
  path: string;
  icon: IconName;
  keywords: string[];
}

/** Tools with their own dedicated pages. */
const CORE_TOOLS: ToolDefinition[] = [
  {
    id: "concrete",
    title: "Concrete Estimate",
    description: "Concrete volume with cement, sand and aggregate quantities for any mix ratio.",
    path: "/tools/concrete",
    icon: "concrete",
    keywords: ["concrete", "volume", "cement", "sand", "khuya"],
  },
  {
    id: "rod-weight",
    title: "Rod Weight",
    description: "Estimate reinforcement steel weight from bar diameter and length.",
    path: "/tools/rod-weight",
    icon: "rod",
    keywords: ["rod", "bar", "steel", "reinforcement", "weight", "lapping"],
  },
  {
    id: "pile",
    title: "Pile Material Estimate",
    description: "Concrete, cement, sand and steel for cast-in-place pile work.",
    path: "/tools/pile",
    icon: "pile",
    keywords: ["pile", "foundation", "deep", "piling"],
  },
  {
    id: "beam",
    title: "Beam Material Estimate",
    description: "Concrete, materials, main bars and stirrups with L/4 or L/3 ring spacing.",
    path: "/tools/beam",
    icon: "beam",
    keywords: ["beam", "stirrup", "ring", "spacing", "L/4", "L/3"],
  },
  {
    id: "column",
    title: "Column Material Estimate",
    description: "Concrete, materials, main bars and ties for reinforced columns.",
    path: "/tools/column",
    icon: "column",
    keywords: ["column", "tie", "pillar", "vertical", "reinforcement"],
  },
];

/** Tools described by a spec and rendered by the shared generic page. */
const SPEC_TOOLS: ToolDefinition[] = GENERIC_SPECS.map((s) => ({
  id: s.slug,
  title: s.title.replace(/ Calculator$/, ""),
  description: s.description,
  path: `/tools/${s.slug}`,
  icon: s.icon,
  keywords: s.keywords,
}));

export const TOOLS: ToolDefinition[] = [...CORE_TOOLS, ...SPEC_TOOLS];
