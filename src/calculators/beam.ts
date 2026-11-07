import { rectangularVolume, withWastage } from "./concrete";
import { calculateRodPlan, rodWeightKg, type RodPlanResult } from "@/lib/reinforcement";

export type RingSpacingMethod = "L/4" | "L/3";

export interface BeamInput {
  /** Beam length in meters. */
  lengthM: number;
  /** Beam width in meters. */
  widthM: number;
  /** Beam height (depth) in meters. */
  heightM: number;
  /** Number of identical beams. */
  beamCount: number;
  /** Main bars at the bottom (tension). */
  bottomBarCount: number;
  /** Main bars at the top (compression). */
  topBarCount: number;
  /** Main bar diameter in mm. */
  mainBarDiameterMm: number;
  /** Lap length for main bars in meters. */
  lapLengthM: number;
  /** Stirrup / ring diameter in mm. */
  ringDiameterMm: number;
  /** Ring spacing method for the end zones: L/4 or L/3. */
  spacingMethod: RingSpacingMethod;
  /** Ring spacing in each end zone, in meters. */
  endSpacingM: number;
  /** Ring spacing in the middle zone, in meters. */
  midSpacingM: number;
  /** Clear cover in meters (per side). */
  coverM: number;
  /** Concrete wastage percentage. */
  wastagePercent: number;
}

export interface RingZone {
  name: string;
  lengthM: number;
  spacingM: number;
  ringCount: number;
}

export interface BeamResult {
  bottomBarCount: number;
  topBarCount: number;
  concreteM3: number;
  concreteWithWastageM3: number;
  endZoneLengthM: number;
  middleZoneLengthM: number;
  zones: RingZone[];
  ringsPerBeam: number;
  totalRings: number;
  ringPerimeterM: number;
  weightPerRingKg: number;
  mainBottomPlan: RodPlanResult;
  mainTopPlan: RodPlanResult;
  mainSteelKg: number;
  ringSteelKg: number;
  totalSteelKg: number;
  steelPerM3Kg: number;
}

/**
 * Zone lengths for the selected ring spacing method.
 *  L/4: each end zone = L/4, middle zone = L/2.
 *  L/3: each end zone = L/3, middle zone = L/3.
 */
export function zoneLengths(lengthM: number, method: RingSpacingMethod): {
  endZoneM: number;
  middleZoneM: number;
} {
  if (method === "L/4") {
    return { endZoneM: lengthM / 4, middleZoneM: lengthM / 2 };
  }
  return { endZoneM: lengthM / 3, middleZoneM: lengthM / 3 };
}

/**
 * Number of rings in a zone: one ring at the zone start, then one every `spacing`.
 */
export function ringsInZone(zoneLengthM: number, spacingM: number): number {
  if (spacingM <= 0) throw new Error("Spacing must be greater than zero.");
  return Math.floor(zoneLengthM / spacingM) + 1;
}

/**
 * Stirrup cut length for a rectangular beam: perimeter of the core rectangle
 * (inside the cover) plus a 135° hook allowance of 2 × 10 × ring diameter.
 */
export function ringPerimeterM(
  widthM: number,
  heightM: number,
  coverM: number,
  ringDiameterMm: number,
): number {
  const innerW = widthM - 2 * coverM;
  const innerH = heightM - 2 * coverM;
  const ringDiameterM = ringDiameterMm / 1000;
  const hookAllowanceM = 2 * 10 * ringDiameterM;
  return 2 * (innerW + innerH) + hookAllowanceM;
}

export function calculateBeam(input: BeamInput): BeamResult {
  const {
    lengthM, widthM, heightM, beamCount, bottomBarCount, topBarCount,
    mainBarDiameterMm, lapLengthM, ringDiameterMm, spacingMethod,
    endSpacingM, midSpacingM, coverM, wastagePercent,
  } = input;

  const concreteM3 = rectangularVolume(lengthM, widthM, heightM) * beamCount;
  const concreteWithWastageM3 = withWastage(concreteM3, wastagePercent);

  const { endZoneM, middleZoneM } = zoneLengths(lengthM, spacingMethod);
  const zones: RingZone[] = [
    { name: "End zone (left)", lengthM: endZoneM, spacingM: endSpacingM,
      ringCount: ringsInZone(endZoneM, endSpacingM) },
    { name: "Middle zone", lengthM: middleZoneM, spacingM: midSpacingM,
      ringCount: ringsInZone(middleZoneM, midSpacingM) },
    { name: "End zone (right)", lengthM: endZoneM, spacingM: endSpacingM,
      ringCount: ringsInZone(endZoneM, endSpacingM) },
  ];

  const ringsPerBeam = zones.reduce((sum, z) => sum + z.ringCount, 0);
  const totalRings = ringsPerBeam * beamCount;

  const ringPerimeter = ringPerimeterM(widthM, heightM, coverM, ringDiameterMm);
  const weightPerRingKg = rodWeightKg(ringDiameterMm, ringPerimeter);
  const ringSteelKg = weightPerRingKg * totalRings;

  const mainBottomPlan = calculateRodPlan({
    requiredLengthM: lengthM,
    count: bottomBarCount * beamCount,
    diameterMm: mainBarDiameterMm,
    lapLengthM,
  });
  const mainTopPlan = calculateRodPlan({
    requiredLengthM: lengthM,
    count: topBarCount * beamCount,
    diameterMm: mainBarDiameterMm,
    lapLengthM,
  });
  const mainSteelKg = mainBottomPlan.netWeightKg + mainTopPlan.netWeightKg;
  const totalSteelKg = mainSteelKg + ringSteelKg;

  return {
    bottomBarCount: bottomBarCount * beamCount,
    topBarCount: topBarCount * beamCount,
    concreteM3,
    concreteWithWastageM3,
    endZoneLengthM: endZoneM,
    middleZoneLengthM: middleZoneM,
    zones,
    ringsPerBeam,
    totalRings,
    ringPerimeterM: ringPerimeter,
    weightPerRingKg,
    mainBottomPlan,
    mainTopPlan,
    mainSteelKg,
    ringSteelKg,
    totalSteelKg,
    steelPerM3Kg: concreteM3 > 0 ? totalSteelKg / concreteM3 : 0,
  };
}
