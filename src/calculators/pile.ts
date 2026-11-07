import { cylindricalVolume, withWastage } from "./concrete";
import { calculateRodPlan, rodWeightKg, type RodPlanResult } from "@/lib/reinforcement";

export interface PileInput {
  /** Pile diameter in meters. */
  diameterM: number;
  /** Pile depth / length in meters. */
  depthM: number;
  /** Number of piles. */
  pileCount: number;
  /** Number of main longitudinal bars per pile. */
  mainBarsPerPile: number;
  /** Main bar diameter in mm. */
  mainBarDiameterMm: number;
  /** Lap length for main bars in meters (used only if bar exceeds standard length). */
  lapLengthM: number;
  /** Ring/spiral diameter in mm. */
  ringDiameterMm: number;
  /** Ring spacing in meters. */
  ringSpacingM: number;
  /** Concrete wastage percentage. */
  wastagePercent: number;
}

export interface PileResult {
  pileCount: number;
  mainBarCount: number;
  concretePerPileM3: number;
  totalConcreteM3: number;
  totalConcreteWithWastageM3: number;
  mainBarPlan: RodPlanResult;
  mainSteelTotalKg: number;
  ringsPerPile: number;
  totalRings: number;
  ringLengthPerRingM: number;
  ringSteelTotalKg: number;
  totalSteelKg: number;
}

/**
 * Estimate concrete and steel for a set of identical cast-in-place piles.
 * Ring perimeter is approximated as π × (pile diameter − 2 × cover) with the
 * cover fixed at 75 mm (standard assumption) plus a 0.3 m hook allowance.
 */
export function calculatePile(input: PileInput): PileResult {
  const { diameterM, depthM, pileCount, mainBarsPerPile, mainBarDiameterMm,
    lapLengthM, ringDiameterMm, ringSpacingM, wastagePercent } = input;

  const concretePerPileM3 = cylindricalVolume(diameterM, depthM);
  const totalConcreteM3 = concretePerPileM3 * pileCount;
  const totalConcreteWithWastageM3 = withWastage(totalConcreteM3, wastagePercent);

  const mainBarPlan = calculateRodPlan({
    requiredLengthM: depthM,
    count: mainBarsPerPile * pileCount,
    diameterMm: mainBarDiameterMm,
    lapLengthM,
  });
  const mainSteelTotalKg = mainBarPlan.netWeightKg;

  const coverM = 0.075;
  const ringDiameterM = Math.max(diameterM - 2 * coverM, 0.05);
  const ringLengthPerRingM = Math.PI * ringDiameterM + 0.3;
  const ringsPerPile = Math.floor(depthM / ringSpacingM) + 1;
  const ringWeightPerRingKg = rodWeightKg(ringDiameterMm, ringLengthPerRingM);
  const ringSteelTotalKg = ringWeightPerRingKg * ringsPerPile * pileCount;

  return {
    pileCount,
    mainBarCount: mainBarsPerPile * pileCount,
    concretePerPileM3,
    totalConcreteM3,
    totalConcreteWithWastageM3,
    mainBarPlan,
    mainSteelTotalKg,
    ringsPerPile,
    totalRings: ringsPerPile * pileCount,
    ringLengthPerRingM,
    ringSteelTotalKg,
    totalSteelKg: mainSteelTotalKg + ringSteelTotalKg,
  };
}
