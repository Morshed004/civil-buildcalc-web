import { useState } from "react";
import { CalculatorShell } from "@/components/CalculatorShell";
import { MeasureField } from "@/components/MeasureField";
import { NumberField } from "@/components/NumberField";
import { SelectField } from "@/components/SelectField";
import { SegmentedControl } from "@/components/SegmentedControl";
import { MixDesignPanel } from "@/components/MixDesignPanel";
import { MortarPanel } from "@/components/MortarPanel";
import { ResultCard, ResultRow, ResultsPlaceholder } from "@/components/ResultCard";
import {
  initialValues,
  type ComputeOutput,
  type FieldGroup,
  type FieldSpec,
  type ToolSpec,
  type Values,
} from "@/lib/calcSchema";
import type { Measure } from "@/lib/units";
import type { MixFormState, MortarFormState } from "@/lib/materials";

type Setter = (key: string, value: unknown) => void;

function renderField(f: FieldSpec, values: Values, set: Setter) {
  switch (f.kind) {
    case "measure":
      return (
        <MeasureField
          key={f.key}
          label={f.label}
          measure={values[f.key] as Measure}
          units={f.units}
          placeholder={f.placeholder}
          hint={f.hint}
          onChange={(m) => set(f.key, m)}
        />
      );
    case "count":
    case "number":
      return (
        <NumberField
          key={f.key}
          label={f.label}
          value={values[f.key] as string}
          step={f.kind === "count" ? "1" : "any"}
          suffix={f.suffix}
          placeholder={f.placeholder}
          hint={f.hint}
          onChange={(v) => set(f.key, v)}
        />
      );
    case "select":
      return (
        <SelectField
          key={f.key}
          label={f.label}
          value={values[f.key] as string}
          options={f.options}
          hint={f.hint}
          onChange={(v) => set(f.key, v)}
        />
      );
    case "segmented":
      return (
        <SegmentedControl
          key={f.key}
          label={f.label}
          value={values[f.key] as string}
          options={f.options}
          hint={f.hint}
          onChange={(v) => set(f.key, v)}
        />
      );
    case "mix":
      return (
        <MixDesignPanel
          key={f.key}
          value={values[f.key] as MixFormState}
          onChange={(v) => set(f.key, v)}
        />
      );
    case "mortar":
      return (
        <MortarPanel
          key={f.key}
          value={values[f.key] as MortarFormState}
          onChange={(v) => set(f.key, v)}
        />
      );
  }
}

/** Mix and mortar panels draw their own section headings, so they are not wrapped again. */
function renderGroup(group: FieldGroup, values: Values, set: Setter) {
  const onlyPanel =
    group.fields.length === 1 && (group.fields[0].kind === "mix" || group.fields[0].kind === "mortar");
  if (onlyPanel) {
    return <div key={group.title}>{group.fields.map((f) => renderField(f, values, set))}</div>;
  }
  return (
    <div className="fields-section" key={group.title}>
      <p className="fields-section__title">{group.title}</p>
      <div className="fields-grid">{group.fields.map((f) => renderField(f, values, set))}</div>
    </div>
  );
}

export function GenericToolPage({ spec }: { spec: ToolSpec }) {
  const [values, setValues] = useState<Values>(() => initialValues(spec));
  const [errors, setErrors] = useState<string[]>([]);
  const [output, setOutput] = useState<ComputeOutput | null>(null);

  const set: Setter = (key, value) => setValues((prev) => ({ ...prev, [key]: value }));

  const handleCalculate = () => {
    const out = spec.compute(values);
    if (out.errors.length > 0) {
      setErrors(out.errors);
      setOutput(null);
      return;
    }
    setErrors([]);
    setOutput(out);
  };

  const handleReset = () => {
    setValues(initialValues(spec));
    setErrors([]);
    setOutput(null);
  };

  return (
    <CalculatorShell
      title={spec.title}
      description={spec.description}
      errors={errors}
      onCalculate={handleCalculate}
      onReset={handleReset}
      form={<>{spec.groups.map((g) => renderGroup(g, values, set))}</>}
      results={
        output ? (
          <>
            {output.sections.map((section, si) => (
              <ResultCard key={si} title={section.title} highlight={section.highlight}>
                {section.rows.map((r, ri) => (
                  <ResultRow key={ri} label={r.label} value={r.value} emphasis={r.emphasis} />
                ))}
                {section.note && <p className="note">{section.note}</p>}
              </ResultCard>
            ))}
          </>
        ) : (
          <ResultsPlaceholder message="Enter the values and press Calculate to see the quantities." />
        )
      }
    />
  );
}
