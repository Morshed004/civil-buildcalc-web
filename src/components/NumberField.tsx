import { useId } from "react";

interface NumberFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  hint?: string;
  error?: string;
  step?: string;
  /** Optional trailing unit label shown inside the input group. */
  suffix?: string;
}

export function NumberField({
  label,
  value,
  onChange,
  placeholder,
  hint,
  error,
  step = "any",
  suffix,
}: NumberFieldProps) {
  const id = useId();
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;

  return (
    <div className={`field ${error ? "field--error" : ""}`}>
      <label htmlFor={id} className="field__label">{label}</label>
      <div className="field__control">
        <input
          id={id}
          type="number"
          inputMode="decimal"
          className="input"
          value={value}
          placeholder={placeholder}
          step={step}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? errorId : hint ? hintId : undefined}
          onChange={(e) => onChange(e.target.value)}
        />
        {suffix && <span className="field__suffix">{suffix}</span>}
      </div>
      {error ? (
        <p id={errorId} className="field__error" role="alert">{error}</p>
      ) : hint ? (
        <p id={hintId} className="field__hint">{hint}</p>
      ) : null}
    </div>
  );
}
