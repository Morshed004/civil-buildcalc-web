import {
  calculateRodPlan,
  rodWeightKg,
  MAX_STANDARD_ROD_M,
  type RodPlanResult,
} from "@/lib/reinforcement";

export interface BarSet {
  kg: number;
  standardRods: number;
  plan: RodPlanResult | null;
}

/**
 * Steel weight and rod count for a set of identical bars.
 * Bars up to one standard rod are a single piece; longer bars use lapping.
 */
export function barSet(diameterMm: number, lengthM: number, count: number, lapM: number): BarSet {
  if (lengthM <= MAX_STANDARD_ROD_M) {
    return { kg: rodWeightKg(diameterMm, lengthM) * count, standardRods: count, plan: null };
  }
  const plan = calculateRodPlan({ requiredLengthM: lengthM, count, diameterMm, lapLengthM: lapM });
  return { kg: plan.netWeightKg, standardRods: plan.totalStandardRods, plan };
}
