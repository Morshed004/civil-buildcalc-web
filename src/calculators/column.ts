import { rectangularVolume, withWastage } from "./concrete";
import { calculateRodPlan, rodWeightKg, type RodPlanResult } from "@/lib/reinforcement";

export interface ColumnInput {
  /** Column height in meters. */
  heightM: number;
  /** Column width in meters. */
  widthM: number;
  /** Column depth in meters. */
  depthM: number;
  /** Number of columns. */
  columnCount: number;
  /** Number of main vertical bars per column. */
  mainBarCount: number;
  /** Main bar diameter in mm. */
  mainBarDiameterMm: number;
  /** Lap length for main bars in meters. */
  lapLengthM: number;
  /** Tie / ring diameter in mm. */
  tieDiameterMm: number;
  /** Tie spacing in meters. */
  tieSpacingM: number;
  /** Clear cover in meters (per side). */
  coverM: number;
  /** Concrete wastage percentage. */
  wastagePercent: number;
}

export interface ColumnResult {
  concreteM3: number;
  concreteWithWastageM3: number;
  mainBarCount: number;
  mainBarPlan: RodPlanResult;
  mainSteelKg: number;
  tiesPerColumn: number;
  totalTies: number;
  tiePerimeterM: number;
  weightPerTieKg: number;
  tieSteelKg: number;
  totalSteelKg: number;
  steelPerM3Kg: number;
}

/**
 * Perimeter of the tie (inside cover) plus a 135° hook allowance of 2 × 10 × tie diameter.
 */
export function tiePerimeterM(
  widthM: number,
  depthM: number,
  coverM: number,
  tieDiameterMm: number,
): number {
  const innerW = widthM - 2 * coverM;
  const innerD = depthM - 2 * coverM;
  const tieDiameterM = tieDiameterMm / 1000;
  return 2 * (innerW + innerD) + 2 * 10 * tieDiameterM;
}

export function calculateColumn(input: ColumnInput): ColumnResult {
  const {
    heightM, widthM, depthM, columnCount, mainBarCount, mainBarDiameterMm,
    lapLengthM, tieDiameterMm, tieSpacingM, coverM, wastagePercent,
  } = input;

  const concreteM3 = rectangularVolume(heightM, widthM, depthM) * columnCount;
  const concreteWithWastageM3 = withWastage(concreteM3, wastagePercent);

  const mainBarPlan = calculateRodPlan({
    requiredLengthM: heightM,
    count: mainBarCount * columnCount,
    diameterMm: mainBarDiameterMm,
    lapLengthM,
  });
  const mainSteelKg = mainBarPlan.netWeightKg;

  // Ties: one at the base plus one every spacing up the height.
  const tiesPerColumn = Math.floor(heightM / tieSpacingM) + 1;
  const totalTies = tiesPerColumn * columnCount;
  const tiePerimeter = tiePerimeterM(widthM, depthM, coverM, tieDiameterMm);
  const weightPerTieKg = rodWeightKg(tieDiameterMm, tiePerimeter);
  const tieSteelKg = weightPerTieKg * totalTies;

  const totalSteelKg = mainSteelKg + tieSteelKg;

  return {
    concreteM3,
    concreteWithWastageM3,
    mainBarCount: mainBarCount * columnCount,
    mainBarPlan,
    mainSteelKg,
    tiesPerColumn,
    totalTies,
    tiePerimeterM: tiePerimeter,
    weightPerTieKg,
    tieSteelKg,
    totalSteelKg,
    steelPerM3Kg: concreteM3 > 0 ? totalSteelKg / concreteM3 : 0,
  };
}
