import { useId } from "react";
import { ALL_LENGTH_UNITS, LENGTH_UNITS, type LengthUnit, type Measure } from "@/lib/units";

interface MeasureFieldProps {
  label: string;
  measure: Measure;
  onChange: (m: Measure) => void;
  placeholder?: string;
  hint?: string;
  error?: string;
  /** Units offered in this field's selector. Defaults to all length units. */
  units?: LengthUnit[];
}

/** A numeric input with its own independent unit selector. */
export function MeasureField({
  label,
  measure,
  onChange,
  placeholder,
  hint,
  error,
  units = ALL_LENGTH_UNITS,
}: MeasureFieldProps) {
  const id = useId();
  const messageId = `${id}-msg`;
  const message = error ?? hint;

  return (
    <div className={`field ${error ? "field--error" : ""}`}>
      <label htmlFor={id} className="field__label">{label}</label>
      <div className="measure">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          className="input measure__input"
          value={measure.value}
          placeholder={placeholder}
          step="any"
          aria-invalid={Boolean(error)}
          aria-describedby={message ? messageId : undefined}
          onChange={(e) => onChange({ ...measure, value: e.target.value })}
        />
        <select
          aria-label={`${label} unit`}
          className="input select measure__unit"
          value={measure.unit}
          onChange={(e) => onChange({ ...measure, unit: e.target.value as LengthUnit })}
        >
          {units.map((u) => (
            <option key={u} value={u}>{LENGTH_UNITS[u].short}</option>
          ))}
        </select>
      </div>
      {error ? (
        <p id={messageId} className="field__error" role="alert">{error}</p>
      ) : hint ? (
        <p id={messageId} className="field__hint">{hint}</p>
      ) : null}
    </div>
  );
}
