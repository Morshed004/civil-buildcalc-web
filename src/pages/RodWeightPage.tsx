import { useState } from "react";
import { CalculatorShell } from "@/components/CalculatorShell";
import { MeasureField } from "@/components/MeasureField";
import { NumberField } from "@/components/NumberField";
import { RodLappingPanel, RodPlanSummary } from "@/components/RodLappingPanel";
import { ReinforcementSummary } from "@/components/ReinforcementSummary";
import { ResultCard, ResultRow, ResultsPlaceholder } from "@/components/ResultCard";
import { calculateRodWeight } from "@/calculators/rodWeight";
import {
  calculateRodPlan,
  resolveLapLength,
  DEFAULT_LAPPING,
  MAX_STANDARD_ROD_M,
  type LappingState,
  type RodPlanResult,
} from "@/lib/reinforcement";
import { emptyMeasure, BAR_UNITS, type Measure } from "@/lib/units";
import {
  parseLength,
  parseDiameterMm,
  parseCount,
  collectNamedErrors,
  unwrapNamed,
  previewLengthM,
  type ParseResult,
} from "@/lib/validation";
import { fmt } from "@/lib/format";

interface FormState {
  diameter: Measure;
  count: string;
  length: Measure;
  lapping: LappingState;
}

const EMPTY: FormState = {
  diameter: emptyMeasure("", "mm"),
  count: "1",
  length: emptyMeasure(),
  lapping: DEFAULT_LAPPING,
};

interface Computed {
  count: number;
  weightPerMeterKg: number;
  weightPerBarKg: number;
  totalWeightKg: number;
  totalLengthM: number;
  plan: RodPlanResult | null;
  standardRods: number;
}

export function RodWeightPage() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<string[]>([]);
  const [result, setResult] = useState<Computed | null>(null);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleCalculate = () => {
    const lengthP = parseLength(form.length, "Rod length");
    const lapP: ParseResult = lengthP.ok
      ? resolveLapLength(lengthP.value, form.lapping, parseLength)
      : { ok: true, value: 0 };

    const parsed = {
      diameterMm: parseDiameterMm(form.diameter, "Rod diameter"),
      lengthM: lengthP,
      count: parseCount(form.count, "Number of rods"),
      lapM: lapP,
    };
    const errs = collectNamedErrors(parsed);
    if (errs.length > 0) {
      setErrors(errs);
      setResult(null);
      return;
    }
    setErrors([]);

    const v = unwrapNamed(parsed);
    const weights = calculateRodWeight(v.diameterMm, v.lengthM, v.count);
    const plan =
      v.lengthM > MAX_STANDARD_ROD_M
        ? calculateRodPlan({
            requiredLengthM: v.lengthM,
            count: v.count,
            diameterMm: v.diameterMm,
            lapLengthM: v.lapM,
          })
        : null;

    setResult({
      count: v.count,
      weightPerMeterKg: weights.weightPerMeterKg,
      weightPerBarKg: weights.weightPerBarKg,
      totalWeightKg: plan ? plan.netWeightKg : weights.totalWeightKg,
      totalLengthM: plan ? plan.finalLengthPerBarM * v.count : weights.totalLengthM,
      plan,
      standardRods: plan ? plan.totalStandardRods : v.count,
    });
  };

  const handleReset = () => {
    setForm(EMPTY);
    setErrors([]);
    setResult(null);
  };

  return (
    <CalculatorShell
      title="Rod Weight Calculator"
      description="Estimate reinforcement steel weight using Weight (kg) = (D² / 162) × L, with D in mm and L in meters."
      errors={errors}
      onCalculate={handleCalculate}
      onReset={handleReset}
      form={
        <>
          <div className="fields-section">
            <p className="fields-section__title">Bar details</p>
            <div className="fields-grid">
              <MeasureField
                label="Rod diameter"
                measure={form.diameter}
                units={BAR_UNITS}
                onChange={(v) => update("diameter", v)}
                placeholder="e.g. 12"
                hint="Common sizes: 6, 8, 10, 12, 16, 20, 25, 32 mm"
              />
              <NumberField
                label="Number of rods"
                value={form.count}
                onChange={(v) => update("count", v)}
                placeholder="e.g. 10"
                step="1"
              />
              <MeasureField
                label="Rod length"
                measure={form.length}
                onChange={(v) => update("length", v)}
                placeholder="e.g. 12"
              />
            </div>
          </div>

          <RodLappingPanel
            label="Rod"
            value={form.lapping}
            onChange={(v) => update("lapping", v)}
            requiredLengthM={previewLengthM(form.length)}
          />
        </>
      }
      results={
        result ? (
          <>
            <ResultCard title="Total estimated weight" highlight>
              <ResultRow label="Total weight" value={`${fmt(result.totalWeightKg)} kg`} emphasis />
              <ResultRow label="Total weight (tonnes)" value={`${fmt(result.totalWeightKg / 1000, 3)} t`} />
            </ResultCard>
            <ResultCard title="Per bar">
              <ResultRow label="Weight per meter" value={`${fmt(result.weightPerMeterKg, 3)} kg/m`} />
              <ResultRow label="Weight per bar" value={`${fmt(result.weightPerBarKg)} kg`} />
              <ResultRow label="Number of rods" value={`${result.count}`} />
              <ResultRow label="Total length (incl. lapping)" value={`${fmt(result.totalLengthM)} m`} />
            </ResultCard>
            <ReinforcementSummary
              totalSteelKg={result.totalWeightKg}
              mainBars={result.count}
              standardRods={result.standardRods}
            />
            {result.plan && <RodPlanSummary plan={result.plan} count={result.count} />}
          </>
        ) : (
          <ResultsPlaceholder message="Enter diameter and length, then press Calculate to see the steel weight." />
        )
      }
    />
  );
}
