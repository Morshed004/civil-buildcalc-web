interface SegmentedControlProps<T extends string> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
  hint?: string;
}

export function SegmentedControl<T extends string>({
  label,
  value,
  options,
  onChange,
  hint,
}: SegmentedControlProps<T>) {
  return (
    <div className="field">
      <span className="field__label" id={`${label}-label`}>{label}</span>
      <div className="segmented" role="radiogroup" aria-labelledby={`${label}-label`}>
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={value === opt.value}
            className="segmented__option"
            onClick={() => onChange(opt.value)}
          >
            {opt.label}
          </button>
        ))}
      </div>
      {hint && <p className="field__hint">{hint}</p>}
    </div>
  );
}
