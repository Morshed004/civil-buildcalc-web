export type UnitCategory = "length" | "area" | "volume" | "weight";

export interface UnitDef {
  key: string;
  label: string;
  symbol: string;
  category: UnitCategory;
  /** Multiplier that converts one of this unit into the category base unit (m, m², m³, kg). */
  toBase: number;
}

export const UNITS: UnitDef[] = [
  { key: "m", label: "Meter", symbol: "m", category: "length", toBase: 1 },
  { key: "cm", label: "Centimeter", symbol: "cm", category: "length", toBase: 0.01 },
  { key: "mm", label: "Millimeter", symbol: "mm", category: "length", toBase: 0.001 },
  { key: "ft", label: "Foot", symbol: "ft", category: "length", toBase: 0.3048 },
  { key: "in", label: "Inch", symbol: "in", category: "length", toBase: 0.0254 },

  { key: "m2", label: "Square meter", symbol: "m²", category: "area", toBase: 1 },
  { key: "ft2", label: "Square foot", symbol: "ft²", category: "area", toBase: 0.09290304 },
  { key: "yd2", label: "Square yard", symbol: "yd²", category: "area", toBase: 0.83612736 },
  { key: "decimal", label: "Decimal (land)", symbol: "decimal", category: "area", toBase: 40.46856422 },
  { key: "katha", label: "Katha (720 sq ft)", symbol: "katha", category: "area", toBase: 66.8901888 },

  { key: "m3", label: "Cubic meter", symbol: "m³", category: "volume", toBase: 1 },
  { key: "cft", label: "Cubic foot", symbol: "CFT", category: "volume", toBase: 0.0283168466 },
  { key: "yd3", label: "Cubic yard", symbol: "yd³", category: "volume", toBase: 0.764554858 },
  { key: "litre", label: "Litre", symbol: "L", category: "volume", toBase: 0.001 },

  { key: "kg", label: "Kilogram", symbol: "kg", category: "weight", toBase: 1 },
  { key: "ton", label: "Metric ton", symbol: "t", category: "weight", toBase: 1000 },
  { key: "maund", label: "Maund (Bangladesh)", symbol: "maund", category: "weight", toBase: 40 },
  { key: "lb", label: "Pound", symbol: "lb", category: "weight", toBase: 0.45359237 },
  { key: "bag", label: "Cement bag (50 kg)", symbol: "bag", category: "weight", toBase: 50 },
];

export function findUnit(key: string): UnitDef | undefined {
  return UNITS.find((u) => u.key === key);
}
