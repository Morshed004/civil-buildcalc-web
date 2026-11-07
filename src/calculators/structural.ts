/**
 * Concrete and steel geometry for slab, footing, staircase and lintel.
 * All lengths in meters, bar diameters in millimeters.
 */
import { rodWeightKg } from "@/lib/reinforcement";
import { ringPerimeterM } from "./beam";

/** Extra PCC spread beyond each footing edge (standard 150 mm). */
const PCC_PAD_M = 0.15;

export interface SlabGeometry {
  concreteM3: number;
  mainCount: number;
  mainLengthM: number;
  distCount: number;
  distLengthM: number;
}

/** Main bars run along the length, spaced across the width. Distribution bars run across. */
export function slabGeometry(
  lengthM: number,
  widthM: number,
  thicknessM: number,
  mainSpacingM: number,
  distSpacingM: number,
  extraM: number,
): SlabGeometry {
  return {
    concreteM3: lengthM * widthM * thicknessM,
    mainCount: Math.floor(widthM / mainSpacingM) + 1,
    mainLengthM: lengthM + extraM,
    distCount: Math.floor(lengthM / distSpacingM) + 1,
    distLengthM: widthM + extraM,
  };
}

export interface FootingInput {
  lengthM: number;
  widthM: number;
  depthM: number;
  count: number;
  coverM: number;
  spacingM: number;
  hookM: number;
  pccThicknessM: number;
}

export interface FootingGeometry {
  concreteM3: number;
  pccM3: number;
  /** Bars parallel to the length, spread across the width. Count per footing. */
  lengthwiseCount: number;
  lengthwiseLengthM: number;
  /** Bars parallel to the width, spread along the length. Count per footing. */
  widthwiseCount: number;
  widthwiseLengthM: number;
}

export function footingGeometry(i: FootingInput): FootingGeometry {
  const innerW = i.widthM - 2 * i.coverM;
  const innerL = i.lengthM - 2 * i.coverM;
  return {
    concreteM3: i.lengthM * i.widthM * i.depthM * i.count,
    pccM3:
      (i.lengthM + 2 * PCC_PAD_M) * (i.widthM + 2 * PCC_PAD_M) * i.pccThicknessM * i.count,
    lengthwiseCount: Math.floor(innerW / i.spacingM) + 1,
    lengthwiseLengthM: i.lengthM - 2 * i.coverM + 2 * i.hookM,
    widthwiseCount: Math.floor(innerL / i.spacingM) + 1,
    widthwiseLengthM: i.widthM - 2 * i.coverM + 2 * i.hookM,
  };
}

export interface StairInput {
  risers: number;
  riserM: number;
  treadM: number;
  widthM: number;
  waistThicknessM: number;
  landingLengthM: number;
  mainSpacingM: number;
  distSpacingM: number;
  extraM: number;
}

export interface StairGeometry {
  runM: number;
  riseM: number;
  inclinedM: number;
  concreteM3: number;
  mainCount: number;
  mainLengthM: number;
  distCount: number;
  distLengthM: number;
}

/**
 * A flight of n risers between two floor-level landings has (n − 1) treads.
 * Waist slab = inclined length × width × waist thickness.
 * Each riser adds a triangular step section of ½ × rise × tread × width.
 */
export function staircaseGeometry(i: StairInput): StairGeometry {
  const runM = (i.risers - 1) * i.treadM;
  const riseM = i.risers * i.riserM;
  const inclinedM = Math.sqrt(runM * runM + riseM * riseM);
  const waistM3 = inclinedM * i.widthM * i.waistThicknessM;
  const stepsM3 = i.risers * 0.5 * i.riserM * i.treadM * i.widthM;
  const landingM3 = i.landingLengthM * i.widthM * i.waistThicknessM;
  return {
    runM,
    riseM,
    inclinedM,
    concreteM3: waistM3 + stepsM3 + landingM3,
    mainCount: Math.floor(i.widthM / i.mainSpacingM) + 1,
    mainLengthM: inclinedM + i.landingLengthM + i.extraM,
    distCount: Math.floor(inclinedM / i.distSpacingM) + 1,
    distLengthM: i.widthM + i.extraM,
  };
}

export interface LintelInput {
  clearSpanM: number;
  bearingM: number;
  widthM: number;
  depthM: number;
  coverM: number;
  stirrupSpacingM: number;
  stirrupDiaMm: number;
  count: number;
}

export interface LintelGeometry {
  lengthM: number;
  concreteM3: number;
  stirrupsPerLintel: number;
  stirrupPerimeterM: number;
  stirrupSteelKg: number;
}

export function lintelGeometry(i: LintelInput): LintelGeometry {
  const lengthM = i.clearSpanM + 2 * i.bearingM;
  const stirrupsPerLintel = Math.floor(lengthM / i.stirrupSpacingM) + 1;
  const stirrupPerimeterM = ringPerimeterM(i.widthM, i.depthM, i.coverM, i.stirrupDiaMm);
  return {
    lengthM,
    concreteM3: lengthM * i.widthM * i.depthM * i.count,
    stirrupsPerLintel,
    stirrupPerimeterM,
    stirrupSteelKg:
      rodWeightKg(i.stirrupDiaMm, stirrupPerimeterM) * stirrupsPerLintel * i.count,
  };
}
