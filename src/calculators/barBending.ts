/**
 * Cutting length of a bent bar (bar bending schedule).
 *  cut = sum of straight segments
 *      + (180° hooks × hook allowance × d)
 *      − (90° bends × bend deduction × d)
 * The allowance and deduction factors are inputs because site and code practice
 * differ (common values: hook 4d, 90° bend deduction 2d).
 */
export function barCutLengthM(
  segmentsM: number,
  diameterMm: number,
  bends90: number,
  hooks180: number,
  bendDeductionFactor: number,
  hookAllowanceFactor: number,
): number {
  const dM = diameterMm / 1000;
  return segmentsM + hooks180 * hookAllowanceFactor * dM - bends90 * bendDeductionFactor * dM;
}
