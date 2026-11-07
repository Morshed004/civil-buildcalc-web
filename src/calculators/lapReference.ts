/**
 * Typical lap lengths as multiples of bar diameter (d).
 * 40d and 50d are common site practice; always confirm with the drawing or engineer.
 */
export const LAP_FACTORS = [40, 50] as const;

export function lapLengthM(diameterMm: number, factor: number): number {
  return (factor * diameterMm) / 1000;
}
