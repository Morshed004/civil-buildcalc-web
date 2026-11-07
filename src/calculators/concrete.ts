/** Concrete volume for a rectangular element, all inputs in meters. Returns m³. */
export function rectangularVolume(lengthM: number, widthM: number, heightM: number): number {
  return lengthM * widthM * heightM;
}

/** Concrete volume for a cylindrical element (e.g. pile), diameter in meters. Returns m³. */
export function cylindricalVolume(diameterM: number, depthM: number): number {
  return Math.PI * (diameterM / 2) ** 2 * depthM;
}

/**
 * Typical dry-volume allowance for concrete wastage and bulking.
 * Engineers commonly add 5–10%; default 5% is used here and can be overridden.
 */
export const DEFAULT_WASTAGE_PERCENT = 5;

export function withWastage(volumeM3: number, wastagePercent = DEFAULT_WASTAGE_PERCENT): number {
  return volumeM3 * (1 + wastagePercent / 100);
}

/** Cubic meters to cubic feet. */
export function m3ToFt3(m3: number): number {
  return m3 * 35.3147;
}

/** Cubic meters to cubic yards. */
export function m3ToYd3(m3: number): number {
  return m3 * 1.30795;
}
