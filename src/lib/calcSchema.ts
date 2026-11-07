/**
 * Shared description format for calculators. A tool is described by its fields
 * (what the user enters) and a compute function (pure logic, no UI).
 */
import type { LengthUnit, Measure } from "./units";
import { emptyMeasure } from "./units";
import { fmt } from "./format";
import { parseLength, type ParseResult } from "./validation";
import { resolveLapLength } from "./reinforcement";
import type {
  ConcreteMaterials,
  MixFormState,
  MortarFormState,
  MortarMaterials,
} from "./materials";
import type { BarSet } from "@/calculators/bars";
import type { IconName } from "./tools";

export type Values = Record<string, unknown>;

export interface SelectOption {
  value: string;
  label: string;
}

export type FieldSpec =
  | {
      kind: "measure";
      key: string;
      label: string;
      initial: Measure;
      units?: LengthUnit[];
      placeholder?: string;
      hint?: string;
    }
  | {
      kind: "count" | "number";
      key: string;
      label: string;
      initial: string;
      placeholder?: string;
      hint?: string;
      suffix?: string;
    }
  | { kind: "select"; key: string; label: string; initial: string; options: SelectOption[]; hint?: string }
  | { kind: "segmented"; key: string; label: string; initial: string; options: SelectOption[]; hint?: string }
  | { kind: "mix"; key: string; initial: MixFormState }
  | { kind: "mortar"; key: string; initial: MortarFormState };

export interface FieldGroup {
  title: string;
  fields: FieldSpec[];
}

export interface ResultRowData {
  label: string;
  value: string;
  emphasis?: boolean;
}

export interface ResultSectionData {
  title: string;
  highlight?: boolean;
  rows: ResultRowData[];
  note?: string;
}

export interface ComputeOutput {
  errors: string[];
  sections: ResultSectionData[];
}

export interface ToolSpec {
  slug: string;
  title: string;
  description: string;
  icon: IconName;
  keywords: string[];
  groups: FieldGroup[];
  compute: (v: Values) => ComputeOutput;
}

/* ---------- value accessors ---------- */

export const mv = (v: Values, k: string): Measure => v[k] as Measure;
export const tv = (v: Values, k: string): string => v[k] as string;
export const mixv = (v: Values, k: string): MixFormState => v[k] as MixFormState;
export const mortarv = (v: Values, k: string): MortarFormState => v[k] as MortarFormState;

export function initialValues(spec: ToolSpec): Values {
  const out: Values = {};
  for (const g of spec.groups) {
    for (const f of g.fields) out[f.key] = f.initial;
  }
  return out;
}

/* ---------- result helpers ---------- */

export const ok = (sections: ResultSectionData[]): ComputeOutput => ({ errors: [], sections });
export const fail = (errors: string[]): ComputeOutput => ({ errors, sections: [] });

export function errorsOf(results: ParseResult[]): string[] {
  return results.flatMap((r) => (r.ok ? [] : [r.error]));
}

export function valueOf(r: ParseResult): number {
  return r.ok ? r.value : 0;
}

/** Lap length for a bar of the given length, using the tool's "lap" field. */
export function lapFor(barLengthM: number, v: Values): ParseResult {
  return resolveLapLength(barLengthM, { lap: mv(v, "lap") }, parseLength);
}

/** Shared lap-length field used by every tool that has reinforcement bars. */
export const LAP_FIELD: FieldSpec = {
  kind: "measure",
  key: "lap",
  label: "Lap length",
  initial: emptyMeasure(),
  placeholder: "e.g. 60",
  hint: "Needed only when a bar is longer than 39.5 ft (12.04 m).",
};

export function concreteRows(m: ConcreteMaterials): ResultRowData[] {
  return [
    { label: "Cement", value: `${m.cementBags} bags (${fmt(m.cementKg, 0)} kg)`, emphasis: true },
    { label: "Sand", value: `${fmt(m.sandCft)} CFT`, emphasis: true },
    { label: "Stone chips / aggregate (khuya)", value: `${fmt(m.aggregateCft)} CFT`, emphasis: true },
    { label: "Mix ratio", value: m.ratioLabel },
    { label: "Net wet concrete", value: `${fmt(m.netWetM3, 3)} m³ (${fmt(m.netWetCft)} CFT)` },
    { label: `Wet concrete with ${m.wastagePercent}% wastage`, value: `${fmt(m.designWetM3, 3)} m³` },
    { label: "Dry volume", value: `${fmt(m.dryCft)} CFT` },
  ];
}

export function mortarRows(m: MortarMaterials): ResultRowData[] {
  return [
    { label: "Cement", value: `${m.cementBags} bags (${fmt(m.cementKg, 0)} kg)`, emphasis: true },
    { label: "Sand", value: `${fmt(m.sandCft)} CFT`, emphasis: true },
    { label: "Mortar ratio", value: m.ratioLabel },
    { label: "Net wet mortar", value: `${fmt(m.netWetM3, 3)} m³` },
    { label: `Wet mortar with ${m.wastagePercent}% wastage`, value: `${fmt(m.designWetM3, 3)} m³` },
    { label: "Dry volume", value: `${fmt(m.dryCft)} CFT` },
  ];
}

export function barRows(label: string, count: number, lengthM: number, set: BarSet): ResultRowData[] {
  return [
    { label: `${label} – count`, value: `${count} pcs`, emphasis: true },
    { label: `${label} – length each`, value: `${fmt(lengthM)} m (${fmt(lengthM / 0.3048)} ft)` },
    { label: `${label} – steel weight`, value: `${fmt(set.kg)} kg` },
  ];
}
