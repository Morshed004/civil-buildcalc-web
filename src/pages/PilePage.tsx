import { useState } from "react";
import { CalculatorShell } from "@/components/CalculatorShell";
import { MeasureField } from "@/components/MeasureField";
import { NumberField } from "@/components/NumberField";
import { MixDesignPanel } from "@/components/MixDesignPanel";
import { MaterialBreakdown } from "@/components/MaterialBreakdown";
import { ReinforcementSummary } from "@/components/ReinforcementSummary";
import { RodLappingPanel, RodPlanSummary } from "@/components/RodLappingPanel";
import { ResultCard, ResultRow, ResultsPlaceholder } from "@/components/ResultCard";
import { calculatePile, type PileResult } from "@/calculators/pile";
import {
  resolveLapLength,
  DEFAULT_LAPPING,
  type LappingState,
} from "@/lib/reinforcement";
import { emptyMeasure, BAR_UNITS, type Measure } from "@/lib/units";
import {
  parseLength,
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
  diameter: Measure;
  depth: Measure;
  pileCount: string;
  mainBars: string;
  mainBarDia: Measure;
  ringDia: Measure;
  ringSpacing: Measure;
  lapping: LappingState;
  mix: MixFormState;
}

const EMPTY: FormState = {
  diameter: emptyMeasure(),
  depth: emptyMeasure(),
  pileCount: "",
  mainBars: "",
  mainBarDia: emptyMeasure("", "mm"),
  ringDia: emptyMeasure("", "mm"),
  ringSpacing: emptyMeasure("150", "mm"),
  lapping: DEFAULT_LAPPING,
  mix: DEFAULT_MIX_FORM,
};

interface Computed {
  calc: PileResult;
  materials: ConcreteMaterials;
}

export function PilePage() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<string[]>([]);
  const [result, setResult] = useState<Computed | null>(null);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleCalculate = () => {
    const depthP = parseLength(form.depth, "Pile depth");
    const lapP: ParseResult = depthP.ok
      ? resolveLapLength(depthP.value, form.lapping, parseLength)
      : { ok: true, value: 0 };
    const mixRes = parseMix(form.mix);

    const parsed = {
      diameterM: parseLength(form.diameter, "Pile diameter"),
      depthM: depthP,
      pileCount: parseCount(form.pileCount, "Number of piles"),
      mainBars: parseCount(form.mainBars, "Main bars per pile"),
      mainBarDiaMm: parseDiameterMm(form.mainBarDia, "Main bar diameter"),
      ringDiaMm: parseDiameterMm(form.ringDia, "Ring diameter"),
      ringSpacingM: parseLength(form.ringSpacing, "Ring spacing"),
      lapM: lapP,
    };
    const errs = [...collectNamedErrors(parsed), ...mixRes.errors];
    const mix = mixRes.mix;
    if (errs.length > 0 || !mix) {
      setErrors(errs);
      setResult(null);
      return;
    }
    setErrors([]);

    const v = unwrapNamed(parsed);
    const calc = calculatePile({
      diameterM: v.diameterM,
      depthM: v.depthM,
      pileCount: v.pileCount,
      mainBarsPerPile: v.mainBars,
      mainBarDiameterMm: v.mainBarDiaMm,
      lapLengthM: v.lapM,
      ringDiameterMm: v.ringDiaMm,
      ringSpacingM: v.ringSpacingM,
      wastagePercent: mix.wastagePercent,
    });
    setResult({
      calc,
      materials: calculateConcreteMaterials(calc.totalConcreteM3, mix),
    });
  };

  const handleReset = () => {
    setForm(EMPTY);
    setErrors([]);
    setResult(null);
  };

  return (
    <CalculatorShell
      title="Pile Material Estimate"
      description="Concrete, cement, sand and aggregate plus main bar and ring steel for cast-in-place piles."
      errors={errors}
      onCalculate={handleCalculate}
      onReset={handleReset}
      form={
        <>
          <div className="fields-section">
            <p className="fields-section__title">Pile geometry</p>
            <div className="fields-grid">
              <MeasureField label="Pile diameter" measure={form.diameter} onChange={(v) => update("diameter", v)} placeholder="e.g. 600" />
              <MeasureField label="Pile depth / length" measure={form.depth} onChange={(v) => update("depth", v)} placeholder="e.g. 12" />
              <NumberField label="Number of piles" value={form.pileCount} onChange={(v) => update("pileCount", v)} placeholder="e.g. 8" step="1" />
            </div>
          </div>

          <div className="fields-section">
            <p className="fields-section__title">Reinforcement</p>
            <div className="fields-grid">
              <NumberField label="Main bars per pile" value={form.mainBars} onChange={(v) => update("mainBars", v)} placeholder="e.g. 8" step="1" />
              <MeasureField label="Main bar diameter" measure={form.mainBarDia} units={BAR_UNITS} onChange={(v) => update("mainBarDia", v)} placeholder="e.g. 16" />
              <MeasureField label="Ring diameter" measure={form.ringDia} units={BAR_UNITS} onChange={(v) => update("ringDia", v)} placeholder="e.g. 10" />
              <MeasureField label="Ring spacing" measure={form.ringSpacing} onChange={(v) => update("ringSpacing", v)} placeholder="e.g. 150" />
            </div>
          </div>

          <RodLappingPanel
            label="Main bars"
            value={form.lapping}
            onChange={(v) => update("lapping", v)}
            requiredLengthM={previewLengthM(form.depth)}
          />

          <MixDesignPanel value={form.mix} onChange={(v) => update("mix", v)} />
        </>
      }
      results={
        result ? (
          <>
            <ResultCard title="Total estimate" highlight>
              <ResultRow label="Total steel" value={`${fmt(result.calc.totalSteelKg)} kg`} emphasis />
              <ResultRow label="Concrete (net)" value={`${fmt(result.calc.totalConcreteM3, 3)} m³`} emphasis />
              <ResultRow label="Concrete per pile" value={`${fmt(result.calc.concretePerPileM3, 3)} m³`} />
              <ResultRow label="Number of piles" value={`${result.calc.pileCount}`} />
            </ResultCard>

            <ReinforcementSummary
              totalSteelKg={result.calc.totalSteelKg}
              mainBars={result.calc.mainBarCount}
              standardRods={result.calc.mainBarPlan.totalStandardRods}
              stirrups={result.calc.totalRings}
              stirrupLabel="Rings / spirals"
              stirrupSteelKg={result.calc.ringSteelTotalKg}
            />

            <MaterialBreakdown materials={result.materials} />

            <RodPlanSummary plan={result.calc.mainBarPlan} count={result.calc.mainBarCount} />

            <ResultCard title="Ring steel">
              <ResultRow label="Ring length (each)" value={`${fmt(result.calc.ringLengthPerRingM)} m`} />
              <ResultRow label="Rings per pile" value={`${result.calc.ringsPerPile}`} />
              <ResultRow label="Total rings (all piles)" value={`${result.calc.totalRings}`} />
              <ResultRow label="Ring steel total" value={`${fmt(result.calc.ringSteelTotalKg)} kg`} />
            </ResultCard>
          </>
        ) : (
          <ResultsPlaceholder message="Enter pile geometry, reinforcement and mix ratio, then press Calculate." />
        )
      }
    />
  );
}
