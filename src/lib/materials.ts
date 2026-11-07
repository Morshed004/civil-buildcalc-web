import {
  parsePositive,
  parseOptionalNonNegative,
  collectNamedErrors,
  unwrapNamed,
} from "./validation";

/** 1 cubic meter = 35.3147 cubic feet (CFT). */
export const M3_TO_CFT = 35.3147;

/** Standard cement bag weight in kg. */
export const CEMENT_BAG_KG = 50;

export const DEFAULT_DRY_FACTOR = 1.54;
export const DEFAULT_BAG_CFT = 1.25;
export const DEFAULT_WASTAGE_PERCENT = 5;

/** Raw form values for the mix panel, kept as strings for live editing. */
export interface MixFormState {
  cement: string;
  sand: string;
  aggregate: string;
  dryFactor: string;
  bagVolume: string;
  wastage: string;
}

export const DEFAULT_MIX_FORM: MixFormState = {
  cement: "1",
  sand: "2",
  aggregate: "4",
  dryFactor: String(DEFAULT_DRY_FACTOR),
  bagVolume: String(DEFAULT_BAG_CFT),
  wastage: String(DEFAULT_WASTAGE_PERCENT),
};

export const MIX_PRESETS: { label: string; cement: string; sand: string; aggregate: string }[] = [
  { label: "1 : 1 : 2", cement: "1", sand: "1", aggregate: "2" },
  { label: "1 : 1.5 : 3", cement: "1", sand: "1.5", aggregate: "3" },
  { label: "1 : 2 : 4", cement: "1", sand: "2", aggregate: "4" },
  { label: "1 : 3 : 6", cement: "1", sand: "3", aggregate: "6" },
];

/** A validated mix, ready for calculation. */
export interface ResolvedMix {
  ratio: { cement: number; sand: number; aggregate: number };
  dryFactor: number;
  bagVolumeCft: number;
  wastagePercent: number;
}

export interface ConcreteMaterials {
  ratioLabel: string;
  wastagePercent: number;
  dryFactor: number;
  bagVolumeCft: number;
  netWetM3: number;
  netWetCft: number;
  designWetM3: number;
  designWetCft: number;
  dryCft: number;
  cementCft: number;
  cementBags: number;
  cementKg: number;
  sandCft: number;
  aggregateCft: number;
}

/** Validate the raw mix form. Returns either errors or a resolved mix. */
export function parseMix(s: MixFormState): { errors: string[]; mix: ResolvedMix | null } {
  const parsed = {
    cement: parsePositive(s.cement, "Cement ratio"),
    sand: parsePositive(s.sand, "Sand ratio"),
    aggregate: parsePositive(s.aggregate, "Aggregate ratio"),
    dryFactor: parsePositive(s.dryFactor, "Dry volume factor"),
    bagVolumeCft: parsePositive(s.bagVolume, "Cement bag volume"),
    wastagePercent: parseOptionalNonNegative(s.wastage, "Wastage"),
  };
  const errors = collectNamedErrors(parsed);
  if (errors.length > 0) return { errors, mix: null };

  const v = unwrapNamed(parsed);
  if (v.dryFactor < 1) {
    return { errors: ["Dry volume factor must be 1.00 or more."], mix: null };
  }
  return {
    errors: [],
    mix: {
      ratio: { cement: v.cement, sand: v.sand, aggregate: v.aggregate },
      dryFactor: v.dryFactor,
      bagVolumeCft: v.bagVolumeCft,
      wastagePercent: v.wastagePercent,
    },
  };
}

const fmtPart = (n: number) => String(Math.round(n * 100) / 100);

/**
 * Material quantities for a given net concrete volume.
 *  design wet volume = net × (1 + wastage)
 *  dry volume        = design wet × dry factor
 *  each material     = dry volume × (its parts ÷ total parts)
 *  cement bags       = cement CFT ÷ bag volume, rounded up to a whole bag
 */
export function calculateConcreteMaterials(netWetM3: number, mix: ResolvedMix): ConcreteMaterials {
  const { ratio, dryFactor, bagVolumeCft, wastagePercent } = mix;
  const totalParts = ratio.cement + ratio.sand + ratio.aggregate;
  const wasteFactor = 1 + wastagePercent / 100;

  const netWetCft = netWetM3 * M3_TO_CFT;
  const designWetM3 = netWetM3 * wasteFactor;
  const designWetCft = designWetM3 * M3_TO_CFT;
  const dryCft = designWetCft * dryFactor;

  const cementCft = (dryCft * ratio.cement) / totalParts;
  // The small epsilon stops floating-point noise (e.g. 7.0000000001) adding an extra bag.
  const cementBags = Math.ceil(cementCft / bagVolumeCft - 1e-9);

  return {
    ratioLabel: `${fmtPart(ratio.cement)} : ${fmtPart(ratio.sand)} : ${fmtPart(ratio.aggregate)}`,
    wastagePercent,
    dryFactor,
    bagVolumeCft,
    netWetM3,
    netWetCft,
    designWetM3,
    designWetCft,
    dryCft,
    cementCft,
    cementBags,
    cementKg: cementBags * CEMENT_BAG_KG,
    sandCft: (dryCft * ratio.sand) / totalParts,
    aggregateCft: (dryCft * ratio.aggregate) / totalParts,
  };
}

/* ---------- Cement : sand mortar (brick work, plaster) ---------- */

export interface MortarFormState {
  cement: string;
  sand: string;
  dryFactor: string;
  bagVolume: string;
  wastage: string;
}

/** Mortar dry factor is usually 1.27 (lower than concrete's 1.54). */
export const DEFAULT_MORTAR_FORM: MortarFormState = {
  cement: "1",
  sand: "6",
  dryFactor: "1.27",
  bagVolume: String(DEFAULT_BAG_CFT),
  wastage: String(DEFAULT_WASTAGE_PERCENT),
};

export const MORTAR_PRESETS: { label: string; cement: string; sand: string }[] = [
  { label: "1 : 3", cement: "1", sand: "3" },
  { label: "1 : 4", cement: "1", sand: "4" },
  { label: "1 : 5", cement: "1", sand: "5" },
  { label: "1 : 6", cement: "1", sand: "6" },
];

export interface ResolvedMortar {
  cement: number;
  sand: number;
  dryFactor: number;
  bagVolumeCft: number;
  wastagePercent: number;
}

export interface MortarMaterials {
  ratioLabel: string;
  wastagePercent: number;
  dryFactor: number;
  bagVolumeCft: number;
  netWetM3: number;
  designWetM3: number;
  designWetCft: number;
  dryCft: number;
  cementCft: number;
  cementBags: number;
  cementKg: number;
  sandCft: number;
}

export function parseMortar(s: MortarFormState): { errors: string[]; mortar: ResolvedMortar | null } {
  const parsed = {
    cement: parsePositive(s.cement, "Cement ratio"),
    sand: parsePositive(s.sand, "Sand ratio"),
    dryFactor: parsePositive(s.dryFactor, "Dry volume factor"),
    bagVolumeCft: parsePositive(s.bagVolume, "Cement bag volume"),
    wastagePercent: parseOptionalNonNegative(s.wastage, "Wastage"),
  };
  const errors = collectNamedErrors(parsed);
  if (errors.length > 0) return { errors, mortar: null };
  const v = unwrapNamed(parsed);
  if (v.dryFactor < 1) {
    return { errors: ["Dry volume factor must be 1.00 or more."], mortar: null };
  }
  return {
    errors: [],
    mortar: {
      cement: v.cement,
      sand: v.sand,
      dryFactor: v.dryFactor,
      bagVolumeCft: v.bagVolumeCft,
      wastagePercent: v.wastagePercent,
    },
  };
}

/** Mortar quantities for a net wet mortar volume (m³). */
export function calculateMortarMaterials(netWetM3: number, m: ResolvedMortar): MortarMaterials {
  const parts = m.cement + m.sand;
  const designWetM3 = netWetM3 * (1 + m.wastagePercent / 100);
  const designWetCft = designWetM3 * M3_TO_CFT;
  const dryCft = designWetCft * m.dryFactor;
  const cementCft = (dryCft * m.cement) / parts;
  const cementBags = Math.ceil(cementCft / m.bagVolumeCft - 1e-9);
  return {
    ratioLabel: `${fmtPart(m.cement)} : ${fmtPart(m.sand)}`,
    wastagePercent: m.wastagePercent,
    dryFactor: m.dryFactor,
    bagVolumeCft: m.bagVolumeCft,
    netWetM3,
    designWetM3,
    designWetCft,
    dryCft,
    cementCft,
    cementBags,
    cementKg: cementBags * CEMENT_BAG_KG,
    sandCft: (dryCft * m.sand) / parts,
  };
}
