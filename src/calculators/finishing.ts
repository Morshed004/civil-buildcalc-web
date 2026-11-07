/**
 * Tile and paint quantities.
 *  Tile count uses the tile pitch (tile size + joint), so it is an approximate
 *  count; edge cuts are covered by the wastage allowance.
 *  Paint litres = area × coats ÷ coverage (m²/L), plus wastage.
 */

export interface TileResult {
  areaM2: number;
  tilesNeeded: number;
  tilesToOrder: number;
  adhesiveKg: number;
  adhesiveBags: number;
}

export function tileQuantity(
  areaM2: number,
  tileLengthM: number,
  tileWidthM: number,
  jointM: number,
  wastagePercent: number,
  adhesiveKgPerM2: number,
  bagKg: number,
): TileResult {
  const pitchM2 = (tileLengthM + jointM) * (tileWidthM + jointM);
  const tilesNeeded = Math.ceil(areaM2 / pitchM2);
  const adhesiveKg = areaM2 * adhesiveKgPerM2;
  return {
    areaM2,
    tilesNeeded,
    tilesToOrder: Math.ceil(tilesNeeded * (1 + wastagePercent / 100)),
    adhesiveKg,
    adhesiveBags: Math.ceil(adhesiveKg / bagKg),
  };
}

export interface PaintResult {
  wallM2: number;
  ceilingM2: number;
  totalM2: number;
  litres: number;
  fourLitreTins: number;
}

export function paintQuantity(
  lengthM: number,
  widthM: number,
  heightM: number,
  openingsM2: number,
  coats: number,
  coverageM2PerL: number,
  wastagePercent: number,
  includeCeiling: boolean,
): PaintResult {
  const wallM2 = 2 * (lengthM + widthM) * heightM - openingsM2;
  const ceilingM2 = includeCeiling ? lengthM * widthM : 0;
  const totalM2 = wallM2 + ceilingM2;
  const litres = ((totalM2 * coats) / coverageM2PerL) * (1 + wastagePercent / 100);
  return { wallM2, ceilingM2, totalM2, litres, fourLitreTins: Math.ceil(litres / 4) };
}
