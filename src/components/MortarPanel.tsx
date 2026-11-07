import { NumberField } from "./NumberField";
import { MORTAR_PRESETS, type MortarFormState } from "@/lib/materials";

interface MortarPanelProps {
  value: MortarFormState;
  onChange: (v: MortarFormState) => void;
}

export function MortarPanel({ value, onChange }: MortarPanelProps) {
  const set = <K extends keyof MortarFormState>(key: K, v: string) =>
    onChange({ ...value, [key]: v });

  const c = Number(value.cement);
  const s = Number(value.sand);
  const validRatio = Number.isFinite(c) && c > 0 && Number.isFinite(s) && s > 0;

  return (
    <>
      <div className="fields-section">
        <p className="fields-section__title">Mortar ratio (cement : sand)</p>
        <div className="chip-row" role="group" aria-label="Mortar ratio presets">
          {MORTAR_PRESETS.map((p) => {
            const active = p.cement === value.cement && p.sand === value.sand;
            return (
              <button
                key={p.label}
                type="button"
                className="chip"
                aria-pressed={active}
                onClick={() => onChange({ ...value, cement: p.cement, sand: p.sand })}
              >
                {p.label}
              </button>
            );
          })}
        </div>
        <div className="fields-grid">
          <NumberField label="Cement (parts)" value={value.cement} onChange={(v) => set("cement", v)} placeholder="1" />
          <NumberField label="Sand (parts)" value={value.sand} onChange={(v) => set("sand", v)} placeholder="6" />
        </div>
        <div className="ratio-preview">
          Mortar {validRatio ? `${c} : ${s}` : "—"}
        </div>
      </div>

      <div className="fields-section">
        <p className="fields-section__title">Material assumptions</p>
        <div className="fields-grid">
          <NumberField
            label="Dry volume factor"
            value={value.dryFactor}
            onChange={(v) => set("dryFactor", v)}
            placeholder="1.27"
            hint="Mortar usually 1.27."
          />
          <NumberField
            label="Cement bag volume"
            value={value.bagVolume}
            onChange={(v) => set("bagVolume", v)}
            placeholder="1.25"
            suffix="CFT"
          />
          <NumberField
            label="Wastage"
            value={value.wastage}
            onChange={(v) => set("wastage", v)}
            placeholder="5"
            suffix="%"
          />
        </div>
      </div>
    </>
  );
}
