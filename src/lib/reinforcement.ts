import { emptyMeasure, feetToMeters, type Measure } from "./units";
import type { ParseResult } from "./validation";

/** Maximum standard reinforcement rod length. */
export const MAX_STANDARD_ROD_FT = 39.5;
export const MAX_STANDARD_ROD_M = feetToMeters(MAX_STANDARD_ROD_FT);

/** weight (kg) = D² / 162 × L (m), with D in mm. */
export const STEEL_WEIGHT_DIVISOR = 162;

export function rodWeightKg(diameterMm: number, lengthM: number): number {
  return ((diameterMm * diameterMm) / STEEL_WEIGHT_DIVISOR) * lengthM;
}

export function weightPerMeterKg(diameterMm: number): number {
  return (diameterMm * diameterMm) / STEEL_WEIGHT_DIVISOR;
}

/** Lap length entered by the user, with its own unit. */
export interface LappingState {
  lap: Measure;
}

export const DEFAULT_LAPPING: LappingState = { lap: emptyMeasure("", "m") };

export interface RodPlanInput {
  requiredLengthM: number;
  count: number;
  diameterMm: number;
  lapLengthM: number;
}

export interface RodPlanResult {
  requiredLengthM: number;
  requiredLengthFt: number;
  exceedsStandard: boolean;
  piecesPerBar: number;
  lapAddedPerBarM: number;
  finalLengthPerBarM: number;
  finalLengthPerBarFt: number;
  totalStandardRods: number;
  totalPurchasedLengthM: number;
  netWeightKg: number;
  purchasedWeightKg: number;
  wasteKg: number;
}

/**
 * Plan the rods for a set of identical bars. Bars longer than the standard
 * rod are built from several pieces joined by lap length.
 */
export function calculateRodPlan(input: RodPlanInput): RodPlanResult {
  const { requiredLengthM, count, diameterMm, lapLengthM } = input;
  const exceedsStandard = requiredLengthM > MAX_STANDARD_ROD_M;

  let piecesPerBar = 1;
  let lapAddedPerBarM = 0;
  let finalLengthPerBarM = requiredLengthM;

  if (exceedsStandard) {
    const effectiveStep = MAX_STANDARD_ROD_M - lapLengthM;
    if (effectiveStep <= 0) {
      throw new Error("Lap length must be smaller than the standard rod length.");
    }
    piecesPerBar = Math.ceil((requiredLengthM - MAX_STANDARD_ROD_M) / effectiveStep) + 1;
    lapAddedPerBarM = (piecesPerBar - 1) * lapLengthM;
    finalLengthPerBarM = requiredLengthM + lapAddedPerBarM;
  }

  // Rods are bought whole, so each piece consumes one full standard rod.
  const totalStandardRods = piecesPerBar * count;
  const totalPurchasedLengthM = totalStandardRods * MAX_STANDARD_ROD_M;

  const netWeightKg = rodWeightKg(diameterMm, finalLengthPerBarM * count);
  const purchasedWeightKg = rodWeightKg(diameterMm, totalPurchasedLengthM);

  return {
    requiredLengthM,
    requiredLengthFt: requiredLengthM / 0.3048,
    exceedsStandard,
    piecesPerBar,
    lapAddedPerBarM,
    finalLengthPerBarM,
    finalLengthPerBarFt: finalLengthPerBarM / 0.3048,
    totalStandardRods,
    totalPurchasedLengthM,
    netWeightKg,
    purchasedWeightKg,
    wasteKg: Math.max(0, purchasedWeightKg - netWeightKg),
  };
}

/**
 * Resolve the lap length for a bar. Only needed when the bar is longer than
 * one standard rod; otherwise returns 0. The lap must be shorter than a rod.
 */
export function resolveLapLength(
  requiredLengthM: number,
  lapping: LappingState,
  parseLength: (m: Measure, label: string) => ParseResult,
): ParseResult {
  if (requiredLengthM <= MAX_STANDARD_ROD_M) {
    return { ok: true, value: 0 };
  }
  const r = parseLength(lapping.lap, "Lap length");
  if (!r.ok) return r;
  if (r.value >= MAX_STANDARD_ROD_M) {
    return {
      ok: false,
      error: `Lap length must be less than the standard rod length (${MAX_STANDARD_ROD_M.toFixed(2)} m).`,
    };
  }
  return r;
}
