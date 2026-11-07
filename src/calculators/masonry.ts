/**
 * Brick work and plaster quantities.
 *
 * Brick joints: each brick occupies (L+j)(W+j)(H+j) of wall volume.
 * Mortar = wall volume − solid brick volume.
 */

export interface BrickworkInput {
  wallLengthM: number;
  wallHeightM: number;
  thicknessM: number;
  openingsM2: number;
  brickLengthM: number;
  brickWidthM: number;
  brickHeightM: number;
  jointM: number;
  brickWastagePercent: number;
}

export interface BrickworkResult {
  netAreaM2: number;
  wallVolumeM3: number;
  bricksNet: number;
  bricksToOrder: number;
  mortarWetM3: number;
}

export function calculateBrickwork(i: BrickworkInput): BrickworkResult {
  const netAreaM2 = i.wallLengthM * i.wallHeightM - i.openingsM2;
  const wallVolumeM3 = netAreaM2 * i.thicknessM;
  const solidM3 = i.brickLengthM * i.brickWidthM * i.brickHeightM;
  const pitchM3 =
    (i.brickLengthM + i.jointM) * (i.brickWidthM + i.jointM) * (i.brickHeightM + i.jointM);
  const bricksNet = wallVolumeM3 / pitchM3;
  return {
    netAreaM2,
    wallVolumeM3,
    bricksNet,
    bricksToOrder: Math.ceil(bricksNet * (1 + i.brickWastagePercent / 100)),
    mortarWetM3: bricksNet * (pitchM3 - solidM3),
  };
}

export interface PlasterResult {
  areaM2: number;
  volumeM3: number;
}

/** Plaster area and wet volume. Thickness in meters. */
export function calculatePlaster(
  lengthM: number,
  heightM: number,
  faces: number,
  openingsM2: number,
  thicknessM: number,
): PlasterResult {
  const areaM2 = lengthM * heightM * faces - openingsM2;
  return { areaM2, volumeM3: areaM2 * thicknessM };
}
