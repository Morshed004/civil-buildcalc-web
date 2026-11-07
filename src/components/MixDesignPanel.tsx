import { NumberField } from "./NumberField";
import { MIX_PRESETS, type MixFormState } from "@/lib/materials";

interface MixDesignPanelProps {
  value: MixFormState;
  onChange: (v: MixFormState) => void;
}

export function MixDesignPanel({ value, onChange }: MixDesignPanelProps) {
  const set = <K extends keyof MixFormState>(key: K, v: string) =>
    onChange({ ...value, [key]: v });

  const parts = [value.cement, value.sand, value.aggregate].map(Number);
  const validRatio = parts.every((p) => Number.isFinite(p) && p > 0);
  const ratioText = validRatio ? `${parts[0]} : ${parts[1]} : ${parts[2]}` : "—";
  const totalParts = validRatio ? parts[0] + parts[1] + parts[2] : null;

  return (
    <>
      <div className="fields-section">
        <p className="fields-section__title">Concrete mix ratio</p>

        <div className="chip-row" role="group" aria-label="Mix ratio presets">
          {MIX_PRESETS.map((p) => {
            const active =
              p.cement === value.cement && p.sand === value.sand && p.aggregate === value.aggregate;
            return (
              <button
                key={p.label}
                type="button"
                className="chip"
                aria-pressed={active}
                onClick={() =>
                  onChange({ ...value, cement: p.cement, sand: p.sand, aggregate: p.aggregate })
                }
              >
                {p.label}
              </button>
            );
          })}
        </div>

        <div className="fields-grid">
          <NumberField
            label="Cement (parts)"
            value={value.cement}
            onChange={(v) => set("cement", v)}
            placeholder="1"
          />
          <NumberField
            label="Sand (parts)"
            value={value.sand}
            onChange={(v) => set("sand", v)}
            placeholder="2"
          />
          <NumberField
            label="Stone chips / aggregate – khuya (parts)"
            value={value.aggregate}
            onChange={(v) => set("aggregate", v)}
            placeholder="4"
          />
        </div>

        <div className="ratio-preview">
          Mix {ratioText}
          {totalParts !== null && <span className="ratio-preview__total"> · {totalParts} parts total</span>}
        </div>
      </div>

      <div className="fields-section">
        <p className="fields-section__title">Material assumptions</p>
        <div className="fields-grid">
          <NumberField
            label="Dry volume factor"
            value={value.dryFactor}
            onChange={(v) => set("dryFactor", v)}
            placeholder="1.54"
            hint="Dry volume = wet volume × factor. Usually 1.54."
          />
          <NumberField
            label="Cement bag volume"
            value={value.bagVolume}
            onChange={(v) => set("bagVolume", v)}
            placeholder="1.25"
            suffix="CFT"
            hint="One 50 kg bag ≈ 1.25 CFT."
          />
          <NumberField
            label="Wastage"
            value={value.wastage}
            onChange={(v) => set("wastage", v)}
            placeholder="5"
            suffix="%"
            hint="Added to the net volume for ordering."
          />
        </div>
      </div>
    </>
  );
}
