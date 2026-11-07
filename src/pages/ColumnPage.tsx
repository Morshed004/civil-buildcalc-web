import { useState } from "react";
import { CalculatorShell } from "@/components/CalculatorShell";
import { MeasureField } from "@/components/MeasureField";
import { NumberField } from "@/components/NumberField";
import { MixDesignPanel } from "@/components/MixDesignPanel";
import { MaterialBreakdown } from "@/components/MaterialBreakdown";
import { ReinforcementSummary } from "@/components/ReinforcementSummary";
import { RodLappingPanel, RodPlanSummary } from "@/components/RodLappingPanel";
import { ResultCard, ResultRow, ResultsPlaceholder } from "@/components/ResultCard";
import { calculateColumn, type ColumnResult } from "@/calculators/column";
import { resolveLapLength, DEFAULT_LAPPING, type LappingState } from "@/lib/reinforcement";
import { emptyMeasure, BAR_UNITS, ALL_LENGTH_UNITS, type Measure } from "@/lib/units";
import {
  parseLength,
  parseOptionalLength,
  parseCount,
  parseDiameterMm,
  collectNamedErrors,
  unwrapNamed,
  previewLengthM,
  type ParseResult,
} from "@/lib/validation";
import {
  DEFAULT_MIX_FORM,
  parseMix,
  calculateConcreteMaterials,
  type MixFormState,
  type ConcreteMaterials,
} from "@/lib/materials";
import { fmt } from "@/lib/format";

interface FormState {
  height: Measure;
  width: Measure;
  depth: Measure;
  cover: Measure;
  columnCount: string;
  mainBars: string;
  mainBarDia: Measure;
  tieDia: Measure;
  tieSpacing: Measure;
  lapping: LappingState;
  mix: MixFormState;
}

const EMPTY: FormState = {
  height: emptyMeasure(),
  width: emptyMeasure(),
  depth: emptyMeasure(),
  cover: emptyMeasure("40", "mm"),
  columnCount: "1",
  mainBars: "",
  mainBarDia: emptyMeasure("", "mm"),
  tieDia: emptyMeasure("", "mm"),
  tieSpacing: emptyMeasure("150", "mm"),
  lapping: DEFAULT_LAPPING,
  mix: DEFAULT_MIX_FORM,
};

interface Computed {
  calc: ColumnResult;
  materials: ConcreteMaterials;
}

export function ColumnPage() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<string[]>([]);
  const [result, setResult] = useState<Computed | null>(null);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleCalculate = () => {
    const heightP = parseLength(form.height, "Column height");
    const lapP: ParseResult = heightP.ok
      ? resolveLapLength(heightP.value, form.lapping, parseLength)
      : { ok: true, value: 0 };
    const mixRes = parseMix(form.mix);

    const parsed = {
      heightM: heightP,
      widthM: parseLength(form.width, "Column width"),
      depthM: parseLength(form.depth, "Column depth"),
      coverM: parseOptionalLength(form.cover, "Clear cover"),
      columnCount: parseCount(form.columnCount, "Number of columns"),
      mainBars: parseCount(form.mainBars, "Main bars per column"),
      mainBarDiaMm: parseDiameterMm(form.mainBarDia, "Main bar diameter"),
      tieDiaMm: parseDiameterMm(form.tieDia, "Tie diameter"),
      tieSpacingM: parseLength(form.tieSpacing, "Tie spacing"),
      lapM: lapP,
    };
    const errs = [...collectNamedErrors(parsed), ...mixRes.errors];
    const mix = mixRes.mix;
    if (errs.length > 0 || !mix) {
      setErrors(errs);
      setResult(null);
      return;
    }

    const v = unwrapNamed(parsed);
    if (v.widthM - 2 * v.coverM <= 0 || v.depthM - 2 * v.coverM <= 0) {
      setErrors(["Clear cover is too large for the column width or depth."]);
      setResult(null);
      return;
    }
    setErrors([]);

    const calc = calculateColumn({
      heightM: v.heightM,
      widthM: v.widthM,
      depthM: v.depthM,
      columnCount: v.columnCount,
      mainBarCount: v.mainBars,
      mainBarDiameterMm: v.mainBarDiaMm,
      lapLengthM: v.lapM,
      tieDiameterMm: v.tieDiaMm,
      tieSpacingM: v.tieSpacingM,
      coverM: v.coverM,
      wastagePercent: mix.wastagePercent,
    });
    setResult({
      calc,
      materials: calculateConcreteMaterials(calc.concreteM3, mix),
    });
  };

  const handleReset = () => {
    setForm(EMPTY);
    setErrors([]);
    setResult(null);
  };

  return (
    <CalculatorShell
      title="Column Material Estimate"
      description="Concrete, cement, sand and aggregate plus vertical main bars and ties for reinforced columns."
      errors={errors}
      onCalculate={handleCalculate}
      onReset={handleReset}
      form={
        <>
          <div className="fields-section">
            <p className="fields-section__title">Column geometry</p>
            <div className="fields-grid">
              <MeasureField label="Column height" measure={form.height} onChange={(v) => update("height", v)} placeholder="e.g. 3.5" />
              <MeasureField label="Column width" measure={form.width} onChange={(v) => update("width", v)} placeholder="e.g. 300" />
              <MeasureField label="Column depth" measure={form.depth} onChange={(v) => update("depth", v)} placeholder="e.g. 300" />
              <NumberField label="Number of columns" value={form.columnCount} onChange={(v) => update("columnCount", v)} placeholder="e.g. 6" step="1" />
              <MeasureField label="Clear cover" measure={form.cover} onChange={(v) => update("cover", v)} placeholder="40" hint="Per side." />
            </div>
          </div>

          <div className="fields-section">
            <p className="fields-section__title">Main reinforcement</p>
            <div className="fields-grid">
              <NumberField label="Main bars per column" value={form.mainBars} onChange={(v) => update("mainBars", v)} placeholder="e.g. 8" step="1" />
              <MeasureField label="Main bar diameter" measure={form.mainBarDia} units={BAR_UNITS} onChange={(v) => update("mainBarDia", v)} placeholder="e.g. 16" />
            </div>
          </div>

          <div className="fields-section">
            <p className="fields-section__title">Ties</p>
            <div className="fields-grid">
              <MeasureField label="Tie diameter" measure={form.tieDia} units={BAR_UNITS} onChange={(v) => update("tieDia", v)} placeholder="e.g. 8" />
              <MeasureField label="Tie spacing" measure={form.tieSpacing} units={ALL_LENGTH_UNITS} onChange={(v) => update("tieSpacing", v)} placeholder="e.g. 150" />
            </div>
          </div>

          <RodLappingPanel
            label="Main bars"
            value={form.lapping}
            onChange={(v) => update("lapping", v)}
            requiredLengthM={previewLengthM(form.height)}
          />

          <MixDesignPanel value={form.mix} onChange={(v) => update("mix", v)} />
        </>
      }
      results={
        result ? (
          <>
            <ResultCard title="Total estimate" highlight>
              <ResultRow label="Total steel" value={`${fmt(result.calc.totalSteelKg)} kg`} emphasis />
              <ResultRow label="Steel per m³ of concrete" value={`${fmt(result.calc.steelPerM3Kg)} kg/m³`} />
              <ResultRow label="Concrete (net)" value={`${fmt(result.calc.concreteM3, 3)} m³`} emphasis />
            </ResultCard>

            <ReinforcementSummary
              totalSteelKg={result.calc.totalSteelKg}
              mainBars={result.calc.mainBarCount}
              standardRods={result.calc.mainBarPlan.totalStandardRods}
              stirrups={result.calc.totalTies}
              stirrupLabel="Ties"
              stirrupSteelKg={result.calc.tieSteelKg}
            />

            <MaterialBreakdown materials={result.materials} />

            <RodPlanSummary plan={result.calc.mainBarPlan} count={result.calc.mainBarCount} />

            <ResultCard title="Ties">
              <ResultRow label="Ties per column" value={`${result.calc.tiesPerColumn}`} />
              <ResultRow label="Total ties (all columns)" value={`${result.calc.totalTies}`} emphasis />
              <ResultRow label="Tie cut length" value={`${fmt(result.calc.tiePerimeterM)} m`} />
              <ResultRow label="Weight per tie" value={`${fmt(result.calc.weightPerTieKg, 3)} kg`} />
              <ResultRow label="Tie steel total" value={`${fmt(result.calc.tieSteelKg)} kg`} />
            </ResultCard>
          </>
        ) : (
          <ResultsPlaceholder message="Enter column dimensions, reinforcement, ties and mix ratio, then press Calculate." />
        )
      }
    />
  );
}
