import { useState } from "react";
import { CalculatorShell } from "@/components/CalculatorShell";
import { MeasureField } from "@/components/MeasureField";
import { NumberField } from "@/components/NumberField";
import { SegmentedControl } from "@/components/SegmentedControl";
import { MixDesignPanel } from "@/components/MixDesignPanel";
import { MaterialBreakdown } from "@/components/MaterialBreakdown";
import { ReinforcementSummary } from "@/components/ReinforcementSummary";
import { RodLappingPanel, RodPlanSummary } from "@/components/RodLappingPanel";
import { ResultCard, ResultRow, ResultsPlaceholder } from "@/components/ResultCard";
import { calculateBeam, type RingSpacingMethod, type BeamResult } from "@/calculators/beam";
import { resolveLapLength, DEFAULT_LAPPING, type LappingState } from "@/lib/reinforcement";
import { emptyMeasure, ALL_LENGTH_UNITS, BAR_UNITS, type Measure } from "@/lib/units";
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
  length: Measure;
  width: Measure;
  height: Measure;
  cover: Measure;
  beamCount: string;
  bottomBars: string;
  topBars: string;
  mainBarDia: Measure;
  ringDia: Measure;
  spacingMethod: RingSpacingMethod;
  endSpacing: Measure;
  midSpacing: Measure;
  lapping: LappingState;
  mix: MixFormState;
}

const EMPTY: FormState = {
  length: emptyMeasure(),
  width: emptyMeasure(),
  height: emptyMeasure(),
  cover: emptyMeasure("25", "mm"),
  beamCount: "1",
  bottomBars: "",
  topBars: "",
  mainBarDia: emptyMeasure("", "mm"),
  ringDia: emptyMeasure("", "mm"),
  spacingMethod: "L/4",
  endSpacing: emptyMeasure("100", "mm"),
  midSpacing: emptyMeasure("150", "mm"),
  lapping: DEFAULT_LAPPING,
  mix: DEFAULT_MIX_FORM,
};

interface Computed {
  calc: BeamResult;
  materials: ConcreteMaterials;
}

export function BeamPage() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<string[]>([]);
  const [result, setResult] = useState<Computed | null>(null);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleCalculate = () => {
    const lengthP = parseLength(form.length, "Beam length");
    const lapP: ParseResult = lengthP.ok
      ? resolveLapLength(lengthP.value, form.lapping, parseLength)
      : { ok: true, value: 0 };
    const mixRes = parseMix(form.mix);

    const parsed = {
      lengthM: lengthP,
      widthM: parseLength(form.width, "Beam width"),
      heightM: parseLength(form.height, "Beam height"),
      coverM: parseOptionalLength(form.cover, "Clear cover"),
      beamCount: parseCount(form.beamCount, "Number of beams"),
      bottomBars: parseCount(form.bottomBars, "Bottom bars"),
      topBars: parseCount(form.topBars, "Top bars"),
      mainBarDiaMm: parseDiameterMm(form.mainBarDia, "Main bar diameter"),
      ringDiaMm: parseDiameterMm(form.ringDia, "Ring diameter"),
      endSpacingM: parseLength(form.endSpacing, "End zone ring spacing"),
      midSpacingM: parseLength(form.midSpacing, "Middle zone ring spacing"),
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
    if (v.widthM - 2 * v.coverM <= 0 || v.heightM - 2 * v.coverM <= 0) {
      setErrors(["Clear cover is too large for the beam width or height."]);
      setResult(null);
      return;
    }
    setErrors([]);

    const calc = calculateBeam({
      lengthM: v.lengthM,
      widthM: v.widthM,
      heightM: v.heightM,
      beamCount: v.beamCount,
      bottomBarCount: v.bottomBars,
      topBarCount: v.topBars,
      mainBarDiameterMm: v.mainBarDiaMm,
      lapLengthM: v.lapM,
      ringDiameterMm: v.ringDiaMm,
      spacingMethod: form.spacingMethod,
      endSpacingM: v.endSpacingM,
      midSpacingM: v.midSpacingM,
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

  const calc = result?.calc ?? null;

  return (
    <CalculatorShell
      title="Beam Material Estimate"
      description="Concrete, cement, sand and aggregate plus main bars and stirrups for rectangular beams. Choose L/4 or L/3 ring zoning for the end regions."
      errors={errors}
      onCalculate={handleCalculate}
      onReset={handleReset}
      form={
        <>
          <div className="fields-section">
            <p className="fields-section__title">Beam geometry</p>
            <div className="fields-grid">
              <MeasureField label="Beam length" measure={form.length} onChange={(v) => update("length", v)} placeholder="e.g. 6" />
              <MeasureField label="Beam width" measure={form.width} onChange={(v) => update("width", v)} placeholder="e.g. 300" />
              <MeasureField label="Beam height" measure={form.height} onChange={(v) => update("height", v)} placeholder="e.g. 500" />
              <NumberField label="Number of beams" value={form.beamCount} onChange={(v) => update("beamCount", v)} placeholder="e.g. 4" step="1" />
              <MeasureField label="Clear cover" measure={form.cover} onChange={(v) => update("cover", v)} placeholder="25" hint="Per side." />
            </div>
          </div>

          <div className="fields-section">
            <p className="fields-section__title">Main reinforcement</p>
            <div className="fields-grid">
              <NumberField label="Bottom bars" value={form.bottomBars} onChange={(v) => update("bottomBars", v)} placeholder="e.g. 3" step="1" />
              <NumberField label="Top bars" value={form.topBars} onChange={(v) => update("topBars", v)} placeholder="e.g. 2" step="1" />
              <MeasureField label="Main bar diameter" measure={form.mainBarDia} units={BAR_UNITS} onChange={(v) => update("mainBarDia", v)} placeholder="e.g. 16" />
            </div>
          </div>

          <div className="fields-section">
            <p className="fields-section__title">Stirrups / rings</p>
            <MeasureField label="Ring diameter" measure={form.ringDia} units={BAR_UNITS} onChange={(v) => update("ringDia", v)} placeholder="e.g. 10" />
            <SegmentedControl
              label="Ring spacing method"
              value={form.spacingMethod}
              options={[
                { value: "L/4", label: "L/4" },
                { value: "L/3", label: "L/3" },
              ]}
              onChange={(v) => update("spacingMethod", v)}
              hint={
                form.spacingMethod === "L/4"
                  ? "End zones are L/4 each; middle zone is the remaining L/2."
                  : "End zones are L/3 each; middle zone is the remaining L/3."
              }
            />
            <div className="fields-grid">
              <MeasureField label="End zone spacing" measure={form.endSpacing} units={ALL_LENGTH_UNITS} onChange={(v) => update("endSpacing", v)} placeholder="e.g. 100" />
              <MeasureField label="Middle zone spacing" measure={form.midSpacing} units={ALL_LENGTH_UNITS} onChange={(v) => update("midSpacing", v)} placeholder="e.g. 150" />
            </div>
          </div>

          <RodLappingPanel
            label="Main bars"
            value={form.lapping}
            onChange={(v) => update("lapping", v)}
            requiredLengthM={previewLengthM(form.length)}
          />

          <MixDesignPanel value={form.mix} onChange={(v) => update("mix", v)} />
        </>
      }
      results={
        result && calc ? (
          <>
            <ResultCard title="Total estimate" highlight>
              <ResultRow label="Total steel" value={`${fmt(calc.totalSteelKg)} kg`} emphasis />
              <ResultRow label="Steel per m³ of concrete" value={`${fmt(calc.steelPerM3Kg)} kg/m³`} />
              <ResultRow label="Concrete (net)" value={`${fmt(calc.concreteM3, 3)} m³`} emphasis />
            </ResultCard>

            <ReinforcementSummary
              totalSteelKg={calc.totalSteelKg}
              mainBars={calc.bottomBarCount + calc.topBarCount}
              standardRods={calc.mainBottomPlan.totalStandardRods + calc.mainTopPlan.totalStandardRods}
              stirrups={calc.totalRings}
              stirrupLabel="Stirrups / rings"
              stirrupSteelKg={calc.ringSteelKg}
            />

            <MaterialBreakdown materials={result.materials} />

            <ResultCard title="Ring spacing – zones">
              <div className="zone-list">
                <div className="zone-list__item zone-list__head">
                  <span>Zone</span><span>Length</span><span>Spacing</span><span>Rings</span>
                </div>
                {calc.zones.map((z) => (
                  <div className="zone-list__item" key={z.name}>
                    <span>{z.name}</span>
                    <span>{fmt(z.lengthM)} m</span>
                    <span>{fmt(z.spacingM)} m</span>
                    <span>{z.ringCount}</span>
                  </div>
                ))}
              </div>
              <ResultRow label="Rings per beam" value={`${calc.ringsPerBeam}`} />
              <ResultRow label="Total rings (all beams)" value={`${calc.totalRings}`} emphasis />
              <ResultRow label="Ring cut length" value={`${fmt(calc.ringPerimeterM)} m`} />
              <ResultRow label="Weight per ring" value={`${fmt(calc.weightPerRingKg, 3)} kg`} />
            </ResultCard>

            <RodPlanSummary plan={calc.mainBottomPlan} count={calc.bottomBarCount} />
            <RodPlanSummary plan={calc.mainTopPlan} count={calc.topBarCount} />
          </>
        ) : (
          <ResultsPlaceholder message="Enter beam dimensions, reinforcement, ring spacing and mix ratio, then press Calculate." />
        )
      }
    />
  );
}
