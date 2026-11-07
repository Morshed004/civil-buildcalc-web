/**
 * Excavation (bank and loose volume) and filling / backfill.
 *  Bank volume  = (L + 2×working) × (W + 2×working) × D × count
 *  Loose volume = bank volume × bulking factor (soil swells after digging)
 *  Filling      = excavation − volume occupied by the structure
 *  Loose soil to bring in = compacted fill × loose-to-compacted factor
 */

export interface ExcavationResult {
  netM3: number;
  bankM3: number;
  looseM3: number;
}

export function excavationVolume(
  lengthM: number,
  widthM: number,
  depthM: number,
  workingSpaceM: number,
  count: number,
  bulkingFactor: number,
): ExcavationResult {
  const netM3 = lengthM * widthM * depthM * count;
  const bankM3 = (lengthM + 2 * workingSpaceM) * (widthM + 2 * workingSpaceM) * depthM * count;
  return { netM3, bankM3, looseM3: bankM3 * bulkingFactor };
}

export interface FillingResult {
  compactedM3: number;
  looseM3: number;
}

export function fillingVolume(
  excavationM3: number,
  structureM3: number,
  looseFactor: number,
): FillingResult {
  const compactedM3 = excavationM3 - structureM3;
  return { compactedM3, looseM3: compactedM3 * looseFactor };
}
