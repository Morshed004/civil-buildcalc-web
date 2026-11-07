import { rodWeightKg, weightPerMeterKg } from "@/lib/reinforcement";

export interface RodWeightResult {
  weightPerMeterKg: number;
  weightPerBarKg: number;
  totalWeightKg: number;
  totalWeightTonnes: number;
  totalLengthM: number;
}

/**
 * Weight of reinforcement steel using: Weight (kg) = (D² / 162) × L (m), D in mm.
 */
export function calculateRodWeight(
  diameterMm: number,
  lengthM: number,
  count: number,
): RodWeightResult {
  const weightPerBarKg = rodWeightKg(diameterMm, lengthM);
  const totalWeightKg = weightPerBarKg * count;
  return {
    weightPerMeterKg: weightPerMeterKg(diameterMm),
    weightPerBarKg,
    totalWeightKg,
    totalWeightTonnes: totalWeightKg / 1000,
    totalLengthM: lengthM * count,
  };
}
