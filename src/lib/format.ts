/** Round to a fixed number of decimals. */
export function round(value: number, decimals = 2): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/** Format a number with thousands separators and fixed decimals. */
export function fmt(value: number, decimals = 2): string {
  return value.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/** Format a value with a unit suffix, e.g. "12.50 m³". */
export function fmtUnit(value: number, unit: string, decimals = 2): string {
  return `${fmt(value, decimals)} ${unit}`;
}
