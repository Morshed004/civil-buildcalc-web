import { toMeters, type Measure } from "./units";

export type ParseResult =
  | { ok: true; value: number }
  | { ok: false; error: string };

/** Parse a required, strictly positive number. */
export function parsePositive(raw: string, fieldLabel: string): ParseResult {
  const trimmed = raw.trim();
  if (trimmed === "") {
    return { ok: false, error: `${fieldLabel} is required.` };
  }
  const value = Number(trimmed);
  if (!Number.isFinite(value)) {
    return { ok: false, error: `${fieldLabel} must be a valid number.` };
  }
  if (value <= 0) {
    return { ok: false, error: `${fieldLabel} must be greater than zero.` };
  }
  return { ok: true, value };
}

/** Parse an optional non-negative number. Empty input is treated as 0. */
export function parseOptionalNonNegative(raw: string, fieldLabel: string): ParseResult {
  const trimmed = raw.trim();
  if (trimmed === "") return { ok: true, value: 0 };
  const value = Number(trimmed);
  if (!Number.isFinite(value)) {
    return { ok: false, error: `${fieldLabel} must be a valid number.` };
  }
  if (value < 0) {
    return { ok: false, error: `${fieldLabel} cannot be negative.` };
  }
  return { ok: true, value };
}

/** Parse a required, strictly positive whole number (bar or pile counts). */
export function parseCount(raw: string, fieldLabel: string): ParseResult {
  const base = parsePositive(raw, fieldLabel);
  if (!base.ok) return base;
  if (!Number.isInteger(base.value)) {
    return { ok: false, error: `${fieldLabel} must be a whole number.` };
  }
  return base;
}

/** Parse a required length measure and return it in meters. */
export function parseLength(m: Measure, label: string): ParseResult {
  const r = parsePositive(m.value, label);
  return r.ok ? { ok: true, value: toMeters(r.value, m.unit) } : r;
}

/** Parse an optional length measure (empty = 0) and return it in meters. */
export function parseOptionalLength(m: Measure, label: string): ParseResult {
  const r = parseOptionalNonNegative(m.value, label);
  return r.ok ? { ok: true, value: toMeters(r.value, m.unit) } : r;
}

/** Parse a bar diameter measure and return it in millimeters. */
export function parseDiameterMm(m: Measure, label: string): ParseResult {
  const r = parseLength(m, label);
  return r.ok ? { ok: true, value: r.value * 1000 } : r;
}

/** Best-effort length in meters for live hints. Returns null if the input is incomplete. */
export function previewLengthM(m: Measure): number | null {
  const r = parseLength(m, "Length");
  return r.ok ? r.value : null;
}

export function collectErrors(results: ParseResult[]): string[] {
  return results.flatMap((r) => (r.ok ? [] : [r.error]));
}

/** Collect error messages from a named set of parse results. */
export function collectNamedErrors(results: Record<string, ParseResult>): string[] {
  return Object.values(results).flatMap((r) => (r.ok ? [] : [r.error]));
}

/**
 * Unwrap a named set of successful parse results into plain numbers with the
 * same keys. Call only after collectNamedErrors has returned no errors.
 */
export function unwrapNamed<T extends Record<string, ParseResult>>(
  results: T,
): { [K in keyof T]: number } {
  const out: Record<string, number> = {};
  const source = results as Record<string, ParseResult>;
  for (const key of Object.keys(source)) {
    const r = source[key];
    if (!r.ok) throw new Error(`unwrapNamed: "${key}" has an unresolved error`);
    out[key] = r.value;
  }
  return out as { [K in keyof T]: number };
}
