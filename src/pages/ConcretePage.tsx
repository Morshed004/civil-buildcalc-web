import { useState } from "react";
import { CalculatorShell } from "@/components/CalculatorShell";
import { MeasureField } from "@/components/MeasureField";
import { MixDesignPanel } from "@/components/MixDesignPanel";
import { MaterialBreakdown } from "@/components/MaterialBreakdown";
import { ResultCard, ResultRow, ResultsPlaceholder } from "@/components/ResultCard";
import { emptyMeasure, type Measure } from "@/lib/units";
import { parseLength, collectNamedErrors, unwrapNamed } from "@/lib/validation";
import { rectangularVolume, m3ToYd3 } from "@/calculators/concrete";
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
  mix: MixFormState;
}

const EMPTY: FormState = {
  length: emptyMeasure(),
  width: emptyMeasure(),
  height: emptyMeasure(),
  mix: DEFAULT_MIX_FORM,
};

interface Computed {
  netM3: number;
  netYd3: number;
  dimsM: { length: number; width: number; height: number };
  materials: ConcreteMaterials;
}

export function ConcretePage() {
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<string[]>([]);
  const [result, setResult] = useState<Computed | null>(null);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleCalculate = () => {
    const parsed = {
      length: parseLength(form.length, "Length"),
      width: parseLength(form.width, "Width"),
      height: parseLength(form.height, "Height / depth"),
    };
    const mixRes = parseMix(form.mix);
    const errs = [...collectNamedErrors(parsed), ...mixRes.errors];
    const mix = mixRes.mix;
    if (errs.length > 0 || !mix) {
      setErrors(errs);
      setResult(null);
      return;
    }
    setErrors([]);

    const d = unwrapNamed(parsed);
    const netM3 = rectangularVolume(d.length, d.width, d.height);
    setResult({
      netM3,
      netYd3: m3ToYd3(netM3),
      dimsM: d,
      materials: calculateConcreteMaterials(netM3, mix),
    });
  };

  const handleReset = () => {
    setForm(EMPTY);
    setErrors([]);
    setResult(null);
  };

  return (
    <CalculatorShell
      title="Concrete Estimate Calculator"
      description="Enter the dimensions, choose the mix ratio and get the concrete volume plus cement, sand and aggregate quantities."
      errors={errors}
      onCalculate={handleCalculate}
      onReset={handleReset}
      form={
        <>
          <div className="fields-section">
            <p className="fields-section__title">Dimensions</p>
            <div className="fields-grid">
              <MeasureField label="Length" measure={form.length} onChange={(v) => update("length", v)} placeholder="e.g. 6" />
              <MeasureField label="Width" measure={form.width} onChange={(v) => update("width", v)} placeholder="e.g. 4" />
              <MeasureField label="Height / depth" measure={form.height} onChange={(v) => update("height", v)} placeholder="e.g. 6" />
            </div>
          </div>
          <MixDesignPanel value={form.mix} onChange={(v) => update("mix", v)} />
        </>
      }
      results={
        result ? (
          <>
            <ResultCard title="Concrete volume" highlight>
              <ResultRow label="Net volume" value={`${fmt(result.netM3, 3)} m³`} emphasis />
              <ResultRow label="Net volume (CFT)" value={`${fmt(result.materials.netWetCft)} CFT`} />
              <ResultRow label="Net volume (cubic yards)" value={`${fmt(result.netYd3, 3)} yd³`} />
              <ResultRow label="Volume with wastage" value={`${fmt(result.materials.designWetM3, 3)} m³`} emphasis />
            </ResultCard>
            <MaterialBreakdown materials={result.materials} />
            <ResultCard title="Dimensions used (m)">
              <ResultRow label="Length" value={`${fmt(result.dimsM.length)} m`} />
              <ResultRow label="Width" value={`${fmt(result.dimsM.width)} m`} />
              <ResultRow label="Height / depth" value={`${fmt(result.dimsM.height)} m`} />
            </ResultCard>
          </>
        ) : (
          <ResultsPlaceholder message="Enter dimensions and press Calculate to see the concrete volume and materials." />
        )
      }
    />
  );
}
