import { emptyMeasure, ALL_LENGTH_UNITS, BAR_UNITS, type Measure } from "@/lib/units";
import {
  DEFAULT_MIX_FORM,
  DEFAULT_MORTAR_FORM,
  M3_TO_CFT,
  parseMix,
  parseMortar,
  calculateConcreteMaterials,
  calculateMortarMaterials,
} from "@/lib/materials";
import {
  parseLength,
  parseDiameterMm,
  parseCount,
  parseOptionalLength,
  parseOptionalNonNegative,
  parsePositive,
  collectNamedErrors,
  unwrapNamed,
} from "@/lib/validation";
import { rodWeightKg, MAX_STANDARD_ROD_M } from "@/lib/reinforcement";
import { fmt } from "@/lib/format";
import { barSet } from "@/calculators/bars";
import { calculateBrickwork, calculatePlaster } from "@/calculators/masonry";
import {
  slabGeometry,
  footingGeometry,
  staircaseGeometry,
  lintelGeometry,
} from "@/calculators/structural";
import { excavationVolume, fillingVolume } from "@/calculators/earthwork";
import { tileQuantity, paintQuantity } from "@/calculators/finishing";
import { barCutLengthM } from "@/calculators/barBending";
import { UNITS, findUnit } from "@/calculators/unitConverter";
import { lapLengthM, LAP_FACTORS } from "@/calculators/lapReference";
import {
  type ToolSpec,
  type Values,
  mv,
  tv,
  mixv,
  mortarv,
  lapFor,
  errorsOf,
  valueOf,
  ok,
  fail,
  LAP_FIELD,
  concreteRows,
  mortarRows,
  barRows,
} from "@/lib/calcSchema";

const measure = (initial: string, unit: Measure["unit"] = "m"): Measure => emptyMeasure(initial, unit);

/* ---------------- Brick work ---------------- */
const brickWork: ToolSpec = {
  slug: "brick-work",
  title: "Brick Work Calculator",
  description: "Brick count, wall volume and cement-sand mortar for brick walls, with door and window deductions.",
  icon: "brick",
  keywords: ["brick", "wall", "mortar", "masonry", "ইট"],
  groups: [
    {
      title: "Wall",
      fields: [
        { kind: "measure", key: "length", label: "Wall length", initial: emptyMeasure(), placeholder: "e.g. 10" },
        { kind: "measure", key: "height", label: "Wall height", initial: emptyMeasure(), placeholder: "e.g. 3" },
        {
          kind: "measure",
          key: "thickness",
          label: "Wall thickness",
          initial: measure("230", "mm"),
          hint: "One brick wall ≈ 230 mm, half brick ≈ 115 mm.",
        },
        {
          kind: "number",
          key: "openings",
          label: "Door & window area (deduct)",
          initial: "",
          suffix: "m²",
          placeholder: "0",
          hint: "Leave empty if none.",
        },
      ],
    },
    {
      title: "Brick size",
      fields: [
        { kind: "measure", key: "bL", label: "Brick length", initial: measure("240", "mm") },
        { kind: "measure", key: "bW", label: "Brick width", initial: measure("115", "mm") },
        { kind: "measure", key: "bH", label: "Brick height", initial: measure("75", "mm") },
        { kind: "measure", key: "joint", label: "Mortar joint", initial: measure("10", "mm") },
        { kind: "number", key: "brickWaste", label: "Brick wastage", initial: "5", suffix: "%" },
      ],
    },
    {
      title: "Mortar",
      fields: [{ kind: "mortar", key: "mortar", initial: { ...DEFAULT_MORTAR_FORM, sand: "6" } }],
    },
  ],
  compute: (v: Values) => {
    const parsed = {
      lengthM: parseLength(mv(v, "length"), "Wall length"),
      heightM: parseLength(mv(v, "height"), "Wall height"),
      thicknessM: parseLength(mv(v, "thickness"), "Wall thickness"),
      openingsM2: parseOptionalNonNegative(tv(v, "openings"), "Door & window area"),
      bLm: parseLength(mv(v, "bL"), "Brick length"),
      bWm: parseLength(mv(v, "bW"), "Brick width"),
      bHm: parseLength(mv(v, "bH"), "Brick height"),
      jointM: parseLength(mv(v, "joint"), "Mortar joint"),
      brickWastagePercent: parseOptionalNonNegative(tv(v, "brickWaste"), "Brick wastage"),
    };
    const mortarRes = parseMortar(mortarv(v, "mortar"));
    const pre = [...collectNamedErrors(parsed), ...mortarRes.errors];
    if (pre.length > 0 || !mortarRes.mortar) return fail(pre);
    const d = unwrapNamed(parsed);
    const mortar = mortarRes.mortar;

    const calc = calculateBrickwork({
      wallLengthM: d.lengthM,
      wallHeightM: d.heightM,
      thicknessM: d.thicknessM,
      openingsM2: d.openingsM2,
      brickLengthM: d.bLm,
      brickWidthM: d.bWm,
      brickHeightM: d.bHm,
      jointM: d.jointM,
      brickWastagePercent: d.brickWastagePercent,
    });
    if (calc.netAreaM2 <= 0) return fail(["Door & window area is larger than the wall area."]);

    const mm = calculateMortarMaterials(calc.mortarWetM3, mortar);
    return ok([
      {
        title: "Brickwork",
        highlight: true,
        rows: [
          { label: "Net wall area", value: `${fmt(calc.netAreaM2)} m²` },
          { label: "Wall volume", value: `${fmt(calc.wallVolumeM3, 3)} m³ (${fmt(calc.wallVolumeM3 * M3_TO_CFT)} CFT)` },
          { label: "Bricks required (net)", value: `${fmt(calc.bricksNet, 0)} pcs` },
          { label: "Bricks to order (with wastage)", value: `${calc.bricksToOrder} pcs`, emphasis: true },
        ],
      },
      { title: `Mortar · ratio ${mm.ratioLabel}`, rows: mortarRows(mm) },
    ]);
  },
};

/* ---------------- Plaster ---------------- */
const plaster: ToolSpec = {
  slug: "plaster",
  title: "Plaster Calculator",
  description: "Plaster area, volume and cement-sand mortar for walls or ceilings.",
  icon: "plaster",
  keywords: ["plaster", "wall", "ceiling", "mortar", "finishing"],
  groups: [
    {
      title: "Surface",
      fields: [
        { kind: "measure", key: "length", label: "Surface length", initial: emptyMeasure(), placeholder: "e.g. 10" },
        { kind: "measure", key: "height", label: "Surface height", initial: emptyMeasure(), placeholder: "e.g. 3" },
        {
          kind: "count",
          key: "faces",
          label: "Number of faces",
          initial: "1",
          hint: "1 for one side of a wall, 2 for both sides.",
        },
        { kind: "number", key: "openings", label: "Door & window area (deduct)", initial: "", suffix: "m²", placeholder: "0" },
        {
          kind: "measure",
          key: "thickness",
          label: "Plaster thickness",
          initial: measure("12", "mm"),
          hint: "Typical 12–15 mm.",
        },
      ],
    },
    {
      title: "Mortar",
      fields: [{ kind: "mortar", key: "mortar", initial: { ...DEFAULT_MORTAR_FORM, sand: "4" } }],
    },
  ],
  compute: (v: Values) => {
    const parsed = {
      lengthM: parseLength(mv(v, "length"), "Surface length"),
      heightM: parseLength(mv(v, "height"), "Surface height"),
      faces: parseCount(tv(v, "faces"), "Number of faces"),
      openingsM2: parseOptionalNonNegative(tv(v, "openings"), "Door & window area"),
      thicknessM: parseLength(mv(v, "thickness"), "Plaster thickness"),
    };
    const mortarRes = parseMortar(mortarv(v, "mortar"));
    const pre = [...collectNamedErrors(parsed), ...mortarRes.errors];
    if (pre.length > 0 || !mortarRes.mortar) return fail(pre);
    const d = unwrapNamed(parsed);

    const calc = calculatePlaster(d.lengthM, d.heightM, d.faces, d.openingsM2, d.thicknessM);
    if (calc.areaM2 <= 0) return fail(["Door & window area is larger than the surface area."]);

    const mm = calculateMortarMaterials(calc.volumeM3, mortarRes.mortar);
    return ok([
      {
        title: "Plaster",
        highlight: true,
        rows: [
          { label: "Plaster area", value: `${fmt(calc.areaM2)} m² (${fmt(calc.areaM2 * 10.7639)} ft²)`, emphasis: true },
          { label: "Plaster volume", value: `${fmt(calc.volumeM3, 4)} m³ (${fmt(calc.volumeM3 * M3_TO_CFT, 3)} CFT)` },
        ],
      },
      { title: `Mortar · ratio ${mm.ratioLabel}`, rows: mortarRows(mm) },
    ]);
  },
};

/* ---------------- Slab ---------------- */
const slab: ToolSpec = {
  slug: "slab",
  title: "Slab Calculator",
  description: "Slab concrete, cement, sand and aggregate with main and distribution bar schedule.",
  icon: "slab",
  keywords: ["slab", "roof", "floor", "concrete", "steel", "rebar"],
  groups: [
    {
      title: "Slab size",
      fields: [
        { kind: "measure", key: "length", label: "Slab length (span)", initial: emptyMeasure(), placeholder: "e.g. 4" },
        { kind: "measure", key: "width", label: "Slab width", initial: emptyMeasure(), placeholder: "e.g. 3" },
        { kind: "measure", key: "thickness", label: "Slab thickness", initial: measure("125", "mm") },
      ],
    },
    { title: "Concrete mix", fields: [{ kind: "mix", key: "mix", initial: DEFAULT_MIX_FORM }] },
    {
      title: "Main bars (along length)",
      fields: [
        { kind: "measure", key: "mainDia", label: "Main bar diameter", initial: measure("12", "mm"), units: BAR_UNITS },
        { kind: "measure", key: "mainSpacing", label: "Main bar spacing", initial: measure("150", "mm"), units: ALL_LENGTH_UNITS },
      ],
    },
    {
      title: "Distribution bars (across)",
      fields: [
        { kind: "measure", key: "distDia", label: "Distribution bar diameter", initial: measure("8", "mm"), units: BAR_UNITS },
        { kind: "measure", key: "distSpacing", label: "Distribution bar spacing", initial: measure("200", "mm"), units: ALL_LENGTH_UNITS },
      ],
    },
    {
      title: "Bar length & lapping",
      fields: [
        {
          kind: "measure",
          key: "extra",
          label: "Extra length per bar (hooks / anchorage)",
          initial: measure("600", "mm"),
          units: ALL_LENGTH_UNITS,
          hint: "Total allowance added to each bar.",
        },
        LAP_FIELD,
      ],
    },
  ],
  compute: (v: Values) => {
    const parsed = {
      lengthM: parseLength(mv(v, "length"), "Slab length"),
      widthM: parseLength(mv(v, "width"), "Slab width"),
      thicknessM: parseLength(mv(v, "thickness"), "Slab thickness"),
      mainDiaMm: parseDiameterMm(mv(v, "mainDia"), "Main bar diameter"),
      mainSpacingM: parseLength(mv(v, "mainSpacing"), "Main bar spacing"),
      distDiaMm: parseDiameterMm(mv(v, "distDia"), "Distribution bar diameter"),
      distSpacingM: parseLength(mv(v, "distSpacing"), "Distribution bar spacing"),
      extraM: parseOptionalLength(mv(v, "extra"), "Extra bar length"),
    };
    const mixRes = parseMix(mixv(v, "mix"));
    const pre = [...collectNamedErrors(parsed), ...mixRes.errors];
    if (pre.length > 0 || !mixRes.mix) return fail(pre);
    const d = unwrapNamed(parsed);
    const mix = mixRes.mix;

    const g = slabGeometry(d.lengthM, d.widthM, d.thicknessM, d.mainSpacingM, d.distSpacingM, d.extraM);
    const lapMain = lapFor(g.mainLengthM, v);
    const lapDist = lapFor(g.distLengthM, v);
    const lapErr = errorsOf([lapMain, lapDist]);
    if (lapErr.length > 0) return fail(lapErr);

    const main = barSet(d.mainDiaMm, g.mainLengthM, g.mainCount, valueOf(lapMain));
    const dist = barSet(d.distDiaMm, g.distLengthM, g.distCount, valueOf(lapDist));
    const mat = calculateConcreteMaterials(g.concreteM3, mix);
    const steelKg = main.kg + dist.kg;

    return ok([
      { title: `Concrete · mix ${mat.ratioLabel}`, highlight: true, rows: concreteRows(mat) },
      {
        title: "Reinforcement schedule",
        rows: [
          ...barRows("Main bars", g.mainCount, g.mainLengthM, main),
          ...barRows("Distribution bars", g.distCount, g.distLengthM, dist),
          { label: "Total steel required", value: `${fmt(steelKg)} kg`, emphasis: true },
          { label: "Standard rods to purchase", value: `${main.standardRods + dist.standardRods} pcs` },
        ],
      },
    ]);
  },
};

/* ---------------- Footing ---------------- */
const footing: ToolSpec = {
  slug: "footing",
  title: "Footing Calculator",
  description: "Isolated footing concrete, PCC blinding and two-way bar schedule.",
  icon: "footing",
  keywords: ["footing", "foundation", "pad", "pcc", "steel"],
  groups: [
    {
      title: "Footing size",
      fields: [
        { kind: "measure", key: "length", label: "Footing length", initial: emptyMeasure(), placeholder: "e.g. 1.5" },
        { kind: "measure", key: "width", label: "Footing width", initial: emptyMeasure(), placeholder: "e.g. 1.5" },
        { kind: "measure", key: "depth", label: "Footing depth", initial: emptyMeasure(), placeholder: "e.g. 0.45" },
        { kind: "count", key: "count", label: "Number of footings", initial: "1" },
        { kind: "measure", key: "cover", label: "Clear cover", initial: measure("50", "mm") },
      ],
    },
    { title: "Concrete mix", fields: [{ kind: "mix", key: "mix", initial: DEFAULT_MIX_FORM }] },
    {
      title: "Reinforcement",
      fields: [
        { kind: "measure", key: "dia", label: "Bar diameter", initial: measure("12", "mm"), units: BAR_UNITS },
        { kind: "measure", key: "spacing", label: "Bar spacing", initial: measure("150", "mm"), units: ALL_LENGTH_UNITS },
        {
          kind: "measure",
          key: "hook",
          label: "Hook / anchorage per end",
          initial: measure("150", "mm"),
          units: ALL_LENGTH_UNITS,
        },
        { kind: "measure", key: "pcc", label: "PCC (blinding) thickness", initial: measure("75", "mm"), units: ALL_LENGTH_UNITS },
        LAP_FIELD,
      ],
    },
  ],
  compute: (v: Values) => {
    const parsed = {
      lengthM: parseLength(mv(v, "length"), "Footing length"),
      widthM: parseLength(mv(v, "width"), "Footing width"),
      depthM: parseLength(mv(v, "depth"), "Footing depth"),
      count: parseCount(tv(v, "count"), "Number of footings"),
      coverM: parseOptionalLength(mv(v, "cover"), "Clear cover"),
      diaMm: parseDiameterMm(mv(v, "dia"), "Bar diameter"),
      spacingM: parseLength(mv(v, "spacing"), "Bar spacing"),
      hookM: parseOptionalLength(mv(v, "hook"), "Hook allowance"),
      pccThicknessM: parseLength(mv(v, "pcc"), "PCC thickness"),
    };
    const mixRes = parseMix(mixv(v, "mix"));
    const pre = [...collectNamedErrors(parsed), ...mixRes.errors];
    if (pre.length > 0 || !mixRes.mix) return fail(pre);
    const d = unwrapNamed(parsed);
    const mix = mixRes.mix;
    if (d.lengthM - 2 * d.coverM <= 0 || d.widthM - 2 * d.coverM <= 0) {
      return fail(["Cover is too large for the footing size."]);
    }

    const g = footingGeometry({
      lengthM: d.lengthM,
      widthM: d.widthM,
      depthM: d.depthM,
      count: d.count,
      coverM: d.coverM,
      spacingM: d.spacingM,
      hookM: d.hookM,
      pccThicknessM: d.pccThicknessM,
    });
    const lapL = lapFor(g.lengthwiseLengthM, v);
    const lapW = lapFor(g.widthwiseLengthM, v);
    const lapErr = errorsOf([lapL, lapW]);
    if (lapErr.length > 0) return fail(lapErr);

    const barsL = barSet(d.diaMm, g.lengthwiseLengthM, g.lengthwiseCount * d.count, valueOf(lapL));
    const barsW = barSet(d.diaMm, g.widthwiseLengthM, g.widthwiseCount * d.count, valueOf(lapW));
    const mat = calculateConcreteMaterials(g.concreteM3, mix);

    return ok([
      { title: `Concrete · mix ${mat.ratioLabel}`, highlight: true, rows: concreteRows(mat) },
      { title: "Blinding (PCC)", rows: [{ label: "PCC volume", value: `${fmt(g.pccM3, 3)} m³ (${fmt(g.pccM3 * M3_TO_CFT)} CFT)` }] },
      {
        title: "Reinforcement schedule",
        rows: [
          ...barRows("Bars along length", g.lengthwiseCount * d.count, g.lengthwiseLengthM, barsL),
          ...barRows("Bars along width", g.widthwiseCount * d.count, g.widthwiseLengthM, barsW),
          { label: "Total steel required", value: `${fmt(barsL.kg + barsW.kg)} kg`, emphasis: true },
          { label: "Standard rods to purchase", value: `${barsL.standardRods + barsW.standardRods} pcs` },
        ],
      },
    ]);
  },
};

/* ---------------- Staircase ---------------- */
const staircase: ToolSpec = {
  slug: "staircase",
  title: "Staircase Calculator",
  description: "Waist slab, steps, landing concrete and reinforcement for a straight flight of stairs.",
  icon: "stair",
  keywords: ["stair", "staircase", "steps", "waist slab", "landing"],
  groups: [
    {
      title: "Flight",
      fields: [
        { kind: "measure", key: "rise", label: "Riser (rise) per step", initial: measure("175", "mm") },
        { kind: "measure", key: "going", label: "Tread (going) per step", initial: measure("250", "mm") },
        { kind: "count", key: "risers", label: "Number of risers", initial: "12", hint: "Steps between two floor levels." },
        { kind: "measure", key: "width", label: "Flight width", initial: measure("1", "m") },
        { kind: "measure", key: "waist", label: "Waist slab thickness", initial: measure("150", "mm") },
        {
          kind: "measure",
          key: "landing",
          label: "Landing length (optional)",
          initial: emptyMeasure("", "m"),
          hint: "Leave empty if there is no landing. Landing width = flight width.",
        },
      ],
    },
    { title: "Concrete mix", fields: [{ kind: "mix", key: "mix", initial: DEFAULT_MIX_FORM }] },
    {
      title: "Reinforcement",
      fields: [
        { kind: "measure", key: "mainDia", label: "Main bar diameter", initial: measure("12", "mm"), units: BAR_UNITS },
        { kind: "measure", key: "mainSpacing", label: "Main bar spacing", initial: measure("150", "mm"), units: ALL_LENGTH_UNITS },
        { kind: "measure", key: "distDia", label: "Distribution bar diameter", initial: measure("8", "mm"), units: BAR_UNITS },
        { kind: "measure", key: "distSpacing", label: "Distribution bar spacing", initial: measure("200", "mm"), units: ALL_LENGTH_UNITS },
        { kind: "measure", key: "extra", label: "Extra length per bar", initial: measure("600", "mm"), units: ALL_LENGTH_UNITS },
        LAP_FIELD,
      ],
    },
  ],
  compute: (v: Values) => {
    const parsed = {
      riserM: parseLength(mv(v, "rise"), "Riser height"),
      treadM: parseLength(mv(v, "going"), "Tread (going)"),
      risers: parseCount(tv(v, "risers"), "Number of risers"),
      widthM: parseLength(mv(v, "width"), "Flight width"),
      waistM: parseLength(mv(v, "waist"), "Waist slab thickness"),
      landingM: parseOptionalLength(mv(v, "landing"), "Landing length"),
      mainDiaMm: parseDiameterMm(mv(v, "mainDia"), "Main bar diameter"),
      mainSpacingM: parseLength(mv(v, "mainSpacing"), "Main bar spacing"),
      distDiaMm: parseDiameterMm(mv(v, "distDia"), "Distribution bar diameter"),
      distSpacingM: parseLength(mv(v, "distSpacing"), "Distribution bar spacing"),
      extraM: parseOptionalLength(mv(v, "extra"), "Extra bar length"),
    };
    const mixRes = parseMix(mixv(v, "mix"));
    const pre = [...collectNamedErrors(parsed), ...mixRes.errors];
    if (pre.length > 0 || !mixRes.mix) return fail(pre);
    const d = unwrapNamed(parsed);
    const mix = mixRes.mix;
    if (d.risers < 2) return fail(["A flight needs at least 2 risers."]);

    const g = staircaseGeometry({
      risers: d.risers,
      riserM: d.riserM,
      treadM: d.treadM,
      widthM: d.widthM,
      waistThicknessM: d.waistM,
      landingLengthM: d.landingM,
      mainSpacingM: d.mainSpacingM,
      distSpacingM: d.distSpacingM,
      extraM: d.extraM,
    });
    const lapMain = lapFor(g.mainLengthM, v);
    const lapDist = lapFor(g.distLengthM, v);
    const lapErr = errorsOf([lapMain, lapDist]);
    if (lapErr.length > 0) return fail(lapErr);

    const main = barSet(d.mainDiaMm, g.mainLengthM, g.mainCount, valueOf(lapMain));
    const dist = barSet(d.distDiaMm, g.distLengthM, g.distCount, valueOf(lapDist));
    const mat = calculateConcreteMaterials(g.concreteM3, mix);

    return ok([
      { title: `Concrete · mix ${mat.ratioLabel}`, highlight: true, rows: concreteRows(mat) },
      {
        title: "Flight geometry",
        rows: [
          { label: "Total horizontal run", value: `${fmt(g.runM)} m` },
          { label: "Total rise", value: `${fmt(g.riseM)} m` },
          { label: "Inclined waist length", value: `${fmt(g.inclinedM)} m` },
        ],
      },
      {
        title: "Reinforcement schedule",
        rows: [
          ...barRows("Main bars", g.mainCount, g.mainLengthM, main),
          ...barRows("Distribution bars", g.distCount, g.distLengthM, dist),
          { label: "Total steel required", value: `${fmt(main.kg + dist.kg)} kg`, emphasis: true },
          { label: "Standard rods to purchase", value: `${main.standardRods + dist.standardRods} pcs` },
        ],
      },
    ]);
  },
};

/* ---------------- Lintel ---------------- */
const lintel: ToolSpec = {
  slug: "lintel",
  title: "Lintel (Chhad) Calculator",
  description: "Lintel concrete, bottom and top bars and stirrups over doors and windows.",
  icon: "lintel",
  keywords: ["lintel", "chhad", "door", "window", "opening"],
  groups: [
    {
      title: "Opening",
      fields: [
        { kind: "measure", key: "span", label: "Clear opening width", initial: emptyMeasure(), placeholder: "e.g. 1.2" },
        { kind: "measure", key: "bearing", label: "Bearing on each side", initial: measure("150", "mm") },
        { kind: "measure", key: "width", label: "Lintel width (wall thickness)", initial: measure("230", "mm") },
        { kind: "measure", key: "depth", label: "Lintel depth", initial: measure("150", "mm") },
        { kind: "count", key: "count", label: "Number of lintels", initial: "1" },
        { kind: "measure", key: "cover", label: "Clear cover", initial: measure("25", "mm") },
      ],
    },
    { title: "Concrete mix", fields: [{ kind: "mix", key: "mix", initial: DEFAULT_MIX_FORM }] },
    {
      title: "Bottom bars",
      fields: [
        { kind: "count", key: "bCount", label: "Bottom bars per lintel", initial: "2" },
        { kind: "measure", key: "bDia", label: "Bottom bar diameter", initial: measure("12", "mm"), units: BAR_UNITS },
      ],
    },
    {
      title: "Top bars (hanger)",
      fields: [
        { kind: "count", key: "tCount", label: "Top bars per lintel", initial: "2" },
        { kind: "measure", key: "tDia", label: "Top bar diameter", initial: measure("10", "mm"), units: BAR_UNITS },
      ],
    },
    {
      title: "Stirrups",
      fields: [
        { kind: "measure", key: "sDia", label: "Stirrup diameter", initial: measure("8", "mm"), units: BAR_UNITS },
        { kind: "measure", key: "sSpacing", label: "Stirrup spacing", initial: measure("150", "mm"), units: ALL_LENGTH_UNITS },
        LAP_FIELD,
      ],
    },
  ],
  compute: (v: Values) => {
    const parsed = {
      clearSpanM: parseLength(mv(v, "span"), "Clear opening width"),
      bearingM: parseLength(mv(v, "bearing"), "Bearing"),
      widthM: parseLength(mv(v, "width"), "Lintel width"),
      depthM: parseLength(mv(v, "depth"), "Lintel depth"),
      count: parseCount(tv(v, "count"), "Number of lintels"),
      coverM: parseOptionalLength(mv(v, "cover"), "Clear cover"),
      bCount: parseCount(tv(v, "bCount"), "Bottom bars"),
      bDiaMm: parseDiameterMm(mv(v, "bDia"), "Bottom bar diameter"),
      tCount: parseCount(tv(v, "tCount"), "Top bars"),
      tDiaMm: parseDiameterMm(mv(v, "tDia"), "Top bar diameter"),
      stirrupDiaMm: parseDiameterMm(mv(v, "sDia"), "Stirrup diameter"),
      stirrupSpacingM: parseLength(mv(v, "sSpacing"), "Stirrup spacing"),
    };
    const mixRes = parseMix(mixv(v, "mix"));
    const pre = [...collectNamedErrors(parsed), ...mixRes.errors];
    if (pre.length > 0 || !mixRes.mix) return fail(pre);
    const d = unwrapNamed(parsed);
    const mix = mixRes.mix;

    const g = lintelGeometry({
      clearSpanM: d.clearSpanM,
      bearingM: d.bearingM,
      widthM: d.widthM,
      depthM: d.depthM,
      coverM: d.coverM,
      stirrupSpacingM: d.stirrupSpacingM,
      stirrupDiaMm: d.stirrupDiaMm,
      count: d.count,
    });
    const lap = lapFor(g.lengthM, v);
    const lapErr = errorsOf([lap]);
    if (lapErr.length > 0) return fail(lapErr);

    const bottom = barSet(d.bDiaMm, g.lengthM, d.bCount * d.count, valueOf(lap));
    const top = barSet(d.tDiaMm, g.lengthM, d.tCount * d.count, valueOf(lap));
    const mat = calculateConcreteMaterials(g.concreteM3, mix);
    const steelKg = bottom.kg + top.kg + g.stirrupSteelKg;

    return ok([
      { title: `Concrete · mix ${mat.ratioLabel}`, highlight: true, rows: concreteRows(mat) },
      {
        title: "Reinforcement schedule",
        rows: [
          { label: "Lintel length (incl. bearing)", value: `${fmt(g.lengthM)} m` },
          ...barRows("Bottom bars", d.bCount * d.count, g.lengthM, bottom),
          ...barRows("Top bars", d.tCount * d.count, g.lengthM, top),
          { label: "Stirrups per lintel", value: `${g.stirrupsPerLintel} pcs` },
          { label: "Stirrup cut length", value: `${fmt(g.stirrupPerimeterM)} m` },
          { label: "Total stirrups", value: `${g.stirrupsPerLintel * d.count} pcs`, emphasis: true },
          { label: "Stirrup steel", value: `${fmt(g.stirrupSteelKg)} kg` },
          { label: "Total steel required", value: `${fmt(steelKg)} kg`, emphasis: true },
          { label: "Standard rods to purchase", value: `${bottom.standardRods + top.standardRods} pcs` },
        ],
      },
    ]);
  },
};

/* ---------------- Excavation ---------------- */
const excavation: ToolSpec = {
  slug: "excavation",
  title: "Excavation Calculator",
  description: "Earthwork volume for foundation pits and trenches, with working space and soil bulking.",
  icon: "excavation",
  keywords: ["excavation", "earthwork", "pit", "trench", "khonon", "khonon kaj"],
  groups: [
    {
      title: "Pit / trench",
      fields: [
        { kind: "measure", key: "length", label: "Length", initial: emptyMeasure(), placeholder: "e.g. 2" },
        { kind: "measure", key: "width", label: "Width", initial: emptyMeasure(), placeholder: "e.g. 2" },
        { kind: "measure", key: "depth", label: "Depth", initial: emptyMeasure(), placeholder: "e.g. 1.5" },
        { kind: "count", key: "count", label: "Number of pits", initial: "1" },
        {
          kind: "measure",
          key: "working",
          label: "Working space each side",
          initial: measure("300", "mm"),
          units: ALL_LENGTH_UNITS,
          hint: "Extra room for shuttering and workers.",
        },
        {
          kind: "number",
          key: "bulk",
          label: "Bulking factor",
          initial: "1.25",
          hint: "Loose volume = bank volume × factor. Usually 1.2–1.3.",
        },
      ],
    },
  ],
  compute: (v: Values) => {
    const parsed = {
      lengthM: parseLength(mv(v, "length"), "Length"),
      widthM: parseLength(mv(v, "width"), "Width"),
      depthM: parseLength(mv(v, "depth"), "Depth"),
      count: parseCount(tv(v, "count"), "Number of pits"),
      workingM: parseOptionalLength(mv(v, "working"), "Working space"),
      bulk: parsePositive(tv(v, "bulk"), "Bulking factor"),
    };
    const pre = collectNamedErrors(parsed);
    if (pre.length > 0) return fail(pre);
    const d = unwrapNamed(parsed);
    if (d.bulk < 1) return fail(["Bulking factor must be 1.00 or more."]);

    const e = excavationVolume(d.lengthM, d.widthM, d.depthM, d.workingM, d.count, d.bulk);
    return ok([
      {
        title: "Excavation (bank volume)",
        highlight: true,
        rows: [
          { label: "Bank volume (with working space)", value: `${fmt(e.bankM3, 3)} m³ (${fmt(e.bankM3 * M3_TO_CFT)} CFT)`, emphasis: true },
          { label: "Loose volume (after bulking)", value: `${fmt(e.looseM3, 3)} m³ (${fmt(e.looseM3 * M3_TO_CFT)} CFT)`, emphasis: true },
          { label: "Net pit volume (no working space)", value: `${fmt(e.netM3, 3)} m³ (${fmt(e.netM3 * M3_TO_CFT)} CFT)` },
        ],
      },
    ]);
  },
};

/* ---------------- Filling / backfill ---------------- */
const filling: ToolSpec = {
  slug: "filling",
  title: "Filling / Backfill Calculator",
  description: "Soil needed to fill the excavation around a structure, after the structure takes its volume.",
  icon: "fill",
  keywords: ["filling", "backfill", "earth filling", "soil", "ghor bhoroa"],
  groups: [
    {
      title: "Excavation",
      fields: [
        { kind: "measure", key: "exL", label: "Excavation length", initial: emptyMeasure(), placeholder: "e.g. 3" },
        { kind: "measure", key: "exW", label: "Excavation width", initial: emptyMeasure(), placeholder: "e.g. 3" },
        { kind: "measure", key: "exD", label: "Excavation depth", initial: emptyMeasure(), placeholder: "e.g. 1.5" },
        { kind: "count", key: "exCount", label: "Number of pits", initial: "1" },
      ],
    },
    {
      title: "Structure below ground",
      fields: [
        { kind: "measure", key: "stL", label: "Structure length", initial: emptyMeasure(), placeholder: "e.g. 2" },
        { kind: "measure", key: "stW", label: "Structure width", initial: emptyMeasure(), placeholder: "e.g. 2" },
        { kind: "measure", key: "stH", label: "Structure height in pit", initial: emptyMeasure(), placeholder: "e.g. 1" },
        { kind: "count", key: "stCount", label: "Number of structures", initial: "1" },
      ],
    },
    {
      title: "Compaction",
      fields: [
        {
          kind: "number",
          key: "loose",
          label: "Loose-to-compacted factor",
          initial: "1.25",
          hint: "Soil needed = compacted fill × factor. Approximate; depends on soil.",
        },
      ],
    },
  ],
  compute: (v: Values) => {
    const parsed = {
      exL: parseLength(mv(v, "exL"), "Excavation length"),
      exW: parseLength(mv(v, "exW"), "Excavation width"),
      exD: parseLength(mv(v, "exD"), "Excavation depth"),
      exCount: parseCount(tv(v, "exCount"), "Number of pits"),
      stL: parseLength(mv(v, "stL"), "Structure length"),
      stW: parseLength(mv(v, "stW"), "Structure width"),
      stH: parseLength(mv(v, "stH"), "Structure height"),
      stCount: parseCount(tv(v, "stCount"), "Number of structures"),
      looseFactor: parsePositive(tv(v, "loose"), "Loose-to-compacted factor"),
    };
    const pre = collectNamedErrors(parsed);
    if (pre.length > 0) return fail(pre);
    const d = unwrapNamed(parsed);

    const excM3 = excavationVolume(d.exL, d.exW, d.exD, 0, d.exCount, 1).netM3;
    const structM3 = d.stL * d.stW * d.stH * d.stCount;
    if (structM3 >= excM3) return fail(["Structure volume is larger than the excavation volume."]);

    const f = fillingVolume(excM3, structM3, d.looseFactor);
    return ok([
      {
        title: "Filling requirement",
        highlight: true,
        rows: [
          { label: "Excavated volume", value: `${fmt(excM3, 3)} m³ (${fmt(excM3 * M3_TO_CFT)} CFT)` },
          { label: "Volume taken by structure", value: `${fmt(structM3, 3)} m³ (${fmt(structM3 * M3_TO_CFT)} CFT)` },
          { label: "Compacted filling needed", value: `${fmt(f.compactedM3, 3)} m³ (${fmt(f.compactedM3 * M3_TO_CFT)} CFT)`, emphasis: true },
          { label: "Loose soil to bring in", value: `${fmt(f.looseM3, 3)} m³ (${fmt(f.looseM3 * M3_TO_CFT)} CFT)`, emphasis: true },
        ],
      },
    ]);
  },
};

/* ---------------- Tile ---------------- */
const tile: ToolSpec = {
  slug: "tile",
  title: "Tile Calculator",
  description: "Tile count with wastage, plus tile adhesive for a floor or wall.",
  icon: "tile",
  keywords: ["tile", "floor", "wall", "adhesive", "flooring"],
  groups: [
    {
      title: "Area",
      fields: [
        { kind: "measure", key: "roomL", label: "Room length", initial: emptyMeasure(), placeholder: "e.g. 4" },
        { kind: "measure", key: "roomW", label: "Room width", initial: emptyMeasure(), placeholder: "e.g. 3" },
      ],
    },
    {
      title: "Tile",
      fields: [
        { kind: "measure", key: "tileL", label: "Tile length", initial: measure("600", "mm"), units: ALL_LENGTH_UNITS },
        { kind: "measure", key: "tileW", label: "Tile width", initial: measure("600", "mm"), units: ALL_LENGTH_UNITS },
        { kind: "measure", key: "joint", label: "Grout joint", initial: measure("2", "mm"), units: ALL_LENGTH_UNITS },
        { kind: "number", key: "waste", label: "Tile wastage", initial: "10", suffix: "%" },
      ],
    },
    {
      title: "Adhesive",
      fields: [
        { kind: "number", key: "adhRate", label: "Adhesive per m²", initial: "4", suffix: "kg", hint: "Typically 3–5 kg/m²." },
        { kind: "number", key: "bagKg", label: "Adhesive bag size", initial: "20", suffix: "kg" },
      ],
    },
  ],
  compute: (v: Values) => {
    const parsed = {
      roomLM: parseLength(mv(v, "roomL"), "Room length"),
      roomWM: parseLength(mv(v, "roomW"), "Room width"),
      tileLM: parseLength(mv(v, "tileL"), "Tile length"),
      tileWM: parseLength(mv(v, "tileW"), "Tile width"),
      jointM: parseOptionalLength(mv(v, "joint"), "Grout joint"),
      waste: parseOptionalNonNegative(tv(v, "waste"), "Tile wastage"),
      adhRate: parsePositive(tv(v, "adhRate"), "Adhesive per m²"),
      bagKg: parsePositive(tv(v, "bagKg"), "Adhesive bag size"),
    };
    const pre = collectNamedErrors(parsed);
    if (pre.length > 0) return fail(pre);
    const d = unwrapNamed(parsed);

    const areaM2 = d.roomLM * d.roomWM;
    const t = tileQuantity(areaM2, d.tileLM, d.tileWM, d.jointM, d.waste, d.adhRate, d.bagKg);
    return ok([
      {
        title: "Tile & adhesive",
        highlight: true,
        rows: [
          { label: "Floor / wall area", value: `${fmt(areaM2)} m² (${fmt(areaM2 * 10.7639)} ft²)` },
          { label: "Tiles needed (approx.)", value: `${t.tilesNeeded} pcs` },
          { label: "Tiles to order (with wastage)", value: `${t.tilesToOrder} pcs`, emphasis: true },
          { label: "Adhesive required", value: `${fmt(t.adhesiveKg, 1)} kg`, emphasis: true },
          { label: "Adhesive bags", value: `${t.adhesiveBags} bags` },
        ],
        note: "Tile count uses tile size plus grout joint. Grout quantity is not calculated here.",
      },
    ]);
  },
};

/* ---------------- Paint ---------------- */
const paint: ToolSpec = {
  slug: "paint",
  title: "Paint Calculator",
  description: "Paint litres for walls and optionally the ceiling, based on coats and coverage.",
  icon: "paint",
  keywords: ["paint", "wall", "ceiling", "emulsion", "distemper", "rang"],
  groups: [
    {
      title: "Room",
      fields: [
        { kind: "measure", key: "length", label: "Room length", initial: emptyMeasure(), placeholder: "e.g. 4" },
        { kind: "measure", key: "width", label: "Room width", initial: emptyMeasure(), placeholder: "e.g. 3" },
        { kind: "measure", key: "height", label: "Room height", initial: emptyMeasure(), placeholder: "e.g. 3" },
        { kind: "number", key: "openings", label: "Door & window area (deduct)", initial: "", suffix: "m²", placeholder: "0" },
        {
          kind: "select",
          key: "ceiling",
          label: "Paint the ceiling too?",
          initial: "no",
          options: [
            { value: "no", label: "No – walls only" },
            { value: "yes", label: "Yes – include ceiling" },
          ],
        },
      ],
    },
    {
      title: "Paint",
      fields: [
        { kind: "count", key: "coats", label: "Number of coats", initial: "2" },
        {
          kind: "number",
          key: "coverage",
          label: "Coverage per litre",
          initial: "12",
          suffix: "m²/L",
          hint: "Emulsion usually 10–14 m²/L. Check the product label.",
        },
        { kind: "number", key: "waste", label: "Wastage", initial: "10", suffix: "%" },
      ],
    },
  ],
  compute: (v: Values) => {
    const parsed = {
      lengthM: parseLength(mv(v, "length"), "Room length"),
      widthM: parseLength(mv(v, "width"), "Room width"),
      heightM: parseLength(mv(v, "height"), "Room height"),
      openingsM2: parseOptionalNonNegative(tv(v, "openings"), "Door & window area"),
      coats: parseCount(tv(v, "coats"), "Number of coats"),
      coverage: parsePositive(tv(v, "coverage"), "Coverage per litre"),
      waste: parseOptionalNonNegative(tv(v, "waste"), "Wastage"),
    };
    const pre = collectNamedErrors(parsed);
    if (pre.length > 0) return fail(pre);
    const d = unwrapNamed(parsed);

    const p = paintQuantity(
      d.lengthM,
      d.widthM,
      d.heightM,
      d.openingsM2,
      d.coats,
      d.coverage,
      d.waste,
      tv(v, "ceiling") === "yes",
    );
    if (p.wallM2 <= 0) return fail(["Door & window area is larger than the wall area."]);

    return ok([
      {
        title: "Paint required",
        highlight: true,
        rows: [
          { label: "Wall area", value: `${fmt(p.wallM2)} m²` },
          { label: "Ceiling area", value: `${fmt(p.ceilingM2)} m²` },
          { label: "Total painted area", value: `${fmt(p.totalM2)} m²` },
          { label: "Paint required", value: `${fmt(p.litres, 2)} litres`, emphasis: true },
          { label: "4-litre tins (approx.)", value: `${p.fourLitreTins} tins`, emphasis: true },
        ],
        note: "Primer and putty are not included. Coverage varies with surface and paint brand.",
      },
    ]);
  },
};

/* ---------------- Bar bending ---------------- */
const barBending: ToolSpec = {
  slug: "bar-bending",
  title: "Bar Bending Schedule",
  description: "Cutting length of a bent reinforcement bar from its segments, bends and hooks.",
  icon: "bend",
  keywords: ["bar bending", "cutting length", "hook", "bend", "stirrup", "schedule"],
  groups: [
    {
      title: "Bar",
      fields: [
        { kind: "measure", key: "dia", label: "Bar diameter", initial: measure("12", "mm"), units: BAR_UNITS },
        { kind: "count", key: "count", label: "Number of bars", initial: "1" },
      ],
    },
    {
      title: "Segments",
      fields: [
        { kind: "measure", key: "a", label: "Segment A (required)", initial: emptyMeasure(), placeholder: "e.g. 3" },
        { kind: "measure", key: "b", label: "Segment B (optional)", initial: emptyMeasure(), placeholder: "0" },
        { kind: "measure", key: "c", label: "Segment C (optional)", initial: emptyMeasure(), placeholder: "0" },
      ],
    },
    {
      title: "Bends & hooks",
      fields: [
        { kind: "number", key: "bends", label: "90° bends", initial: "0" },
        { kind: "number", key: "hooks", label: "180° hooks", initial: "0" },
        {
          kind: "number",
          key: "bendF",
          label: "Deduction per 90° bend",
          initial: "2",
          suffix: "× d",
          hint: "Common practice: 2d. Confirm against your code or site standard.",
        },
        {
          kind: "number",
          key: "hookF",
          label: "Allowance per 180° hook",
          initial: "4",
          suffix: "× d",
          hint: "Common practice: 4d.",
        },
      ],
    },
  ],
  compute: (v: Values) => {
    const parsed = {
      dia: parseDiameterMm(mv(v, "dia"), "Bar diameter"),
      count: parseCount(tv(v, "count"), "Number of bars"),
      a: parseLength(mv(v, "a"), "Segment A"),
      b: parseOptionalLength(mv(v, "b"), "Segment B"),
      c: parseOptionalLength(mv(v, "c"), "Segment C"),
      bends: parseOptionalNonNegative(tv(v, "bends"), "90° bends"),
      hooks: parseOptionalNonNegative(tv(v, "hooks"), "180° hooks"),
      bendF: parseOptionalNonNegative(tv(v, "bendF"), "Bend deduction"),
      hookF: parseOptionalNonNegative(tv(v, "hookF"), "Hook allowance"),
    };
    const pre = collectNamedErrors(parsed);
    if (pre.length > 0) return fail(pre);
    const d = unwrapNamed(parsed);

    const cutM = barCutLengthM(d.a + d.b + d.c, d.dia, d.bends, d.hooks, d.bendF, d.hookF);
    if (cutM <= 0) return fail(["Cutting length must be greater than zero. Check segments and factors."]);
    if (cutM > MAX_STANDARD_ROD_M) {
      return fail([
        `Cut length ${fmt(cutM)} m is longer than one standard rod (${fmt(MAX_STANDARD_ROD_M)} m). Use the lap planning in the Beam or Column tool.`,
      ]);
    }

    const perBarKg = rodWeightKg(d.dia, cutM);
    return ok([
      {
        title: "Cutting schedule",
        highlight: true,
        rows: [
          { label: "Cutting length per bar", value: `${fmt(cutM, 3)} m (${fmt(cutM / 0.3048)} ft)`, emphasis: true },
          { label: "Weight per bar", value: `${fmt(perBarKg, 3)} kg` },
          { label: "Number of bars", value: `${d.count} pcs` },
          { label: "Total weight", value: `${fmt(perBarKg * d.count)} kg`, emphasis: true },
        ],
      },
    ]);
  },
};

/* ---------------- Unit converter ---------------- */
const unitConverter: ToolSpec = {
  slug: "unit-converter",
  title: "Unit Converter",
  description: "Convert length, area, volume and weight, including Bangladesh units like decimal, katha and maund.",
  icon: "convert",
  keywords: ["unit", "convert", "cft", "m3", "katha", "decimal", "maund", "conversion"],
  groups: [
    {
      title: "Value",
      fields: [
        { kind: "number", key: "value", label: "Value", initial: "1" },
        {
          kind: "select",
          key: "unit",
          label: "Unit",
          initial: "m",
          options: UNITS.map((u) => ({ value: u.key, label: `${u.label} (${u.symbol})` })),
        },
      ],
    },
  ],
  compute: (v: Values) => {
    const val = parsePositive(tv(v, "value"), "Value");
    if (!val.ok) return fail([val.error]);
    const def = findUnit(tv(v, "unit"));
    if (!def) return fail(["Select a unit."]);

    const base = val.value * def.toBase;
    const rows = UNITS.filter((u) => u.category === def.category).map((u) => ({
      label: `${u.label} (${u.symbol})`,
      value: `${fmt(base / u.toBase, 4)} ${u.symbol}`,
      emphasis: u.key === def.key,
    }));
    return ok([{ title: `${val.value} ${def.symbol} equals`, highlight: true, rows }]);
  },
};

/* ---------------- Lap reference ---------------- */
const lapReference: ToolSpec = {
  slug: "lap-reference",
  title: "Lap Length Reference",
  description: "Typical lap lengths for any bar diameter, with a reference table for common sizes.",
  icon: "lap",
  keywords: ["lap", "lapping", "overlap", "splice", "40d", "50d"],
  groups: [
    {
      title: "Bar",
      fields: [{ kind: "measure", key: "dia", label: "Bar diameter", initial: measure("12", "mm"), units: BAR_UNITS }],
    },
  ],
  compute: (v: Values) => {
    const dia = parseDiameterMm(mv(v, "dia"), "Bar diameter");
    if (!dia.ok) return fail([dia.error]);

    const yours = LAP_FACTORS.map((f) => {
      const m = lapLengthM(dia.value, f);
      return { label: `${f}d lap`, value: `${fmt(m, 3)} m (${fmt(m / 0.3048, 2)} ft)`, emphasis: f === 40 };
    });
    const common = [8, 10, 12, 16, 20, 25, 32].map((d) => ({
      label: `${d} mm bar`,
      value: LAP_FACTORS.map((f) => `${f}d = ${fmt(lapLengthM(d, f), 3)} m`).join(" · "),
    }));
    return ok([
      {
        title: `Lap for ${fmt(dia.value, 0)} mm bar`,
        highlight: true,
        rows: yours,
        note: "40d–50d is common site practice. Use the drawing or your engineer's specified lap for the final order.",
      },
      { title: "Common bar sizes", rows: common },
    ]);
  },
};

export const GENERIC_SPECS: ToolSpec[] = [
  brickWork,
  plaster,
  slab,
  footing,
  staircase,
  lintel,
  excavation,
  filling,
  tile,
  paint,
  barBending,
  unitConverter,
  lapReference,
];
