export type LengthUnit = "m" | "cm" | "mm" | "ft" | "in";

export const LENGTH_UNITS: Record<LengthUnit, { label: string; short: string; toMeters: number }> = {
  m: { label: "Meters (m)", short: "m", toMeters: 1 },
  cm: { label: "Centimeters (cm)", short: "cm", toMeters: 0.01 },
  mm: { label: "Millimeters (mm)", short: "mm", toMeters: 0.001 },
  ft: { label: "Feet (ft)", short: "ft", toMeters: 0.3048 },
  in: { label: "Inches (in)", short: "in", toMeters: 0.0254 },
};

/** Units offered for general dimensions. */
export const ALL_LENGTH_UNITS: LengthUnit[] = ["m", "cm", "mm", "ft", "in"];

/** Units offered for bar diameters (bars are normally specified in mm or inches). */
export const BAR_UNITS: LengthUnit[] = ["mm", "cm", "in"];

/** A numeric value as typed by the user, together with its own unit. */
export interface Measure {
  value: string;
  unit: LengthUnit;
}

export function emptyMeasure(value = "", unit: LengthUnit = "m"): Measure {
  return { value, unit };
}

/** Convert a value in the given unit into meters. */
export function toMeters(value: number, unit: LengthUnit): number {
  return value * LENGTH_UNITS[unit].toMeters;
}

export function metersToFeet(meters: number): number {
  return meters / 0.3048;
}

export function feetToMeters(feet: number): number {
  return feet * 0.3048;
}
