import { MAX_STANDARD_ROD_FT, type LappingState, type RodPlanResult } from "@/lib/reinforcement";
import { fmt } from "@/lib/format";
import { MeasureField } from "./MeasureField";
import { ResultCard, ResultRow } from "./ResultCard";

interface RodLappingPanelProps {
  /** Shown in the section title, e.g. "Main bars". */
  label: string;
  value: LappingState;
  onChange: (value: LappingState) => void;
  /** Required length of the bar in meters, or null while the input is incomplete. */
  requiredLengthM: number | null;
}

/** Lap length input shared by every reinforcement calculator. */
export function RodLappingPanel({ label, value, onChange, requiredLengthM }: RodLappingPanelProps) {
  const exceeds = requiredLengthM !== null && requiredLengthM > MAX_STANDARD_ROD_FT * 0.3048;

  return (
    <div className="fields-section">
      <p className="fields-section__title">Rod length &amp; lapping – {label}</p>
      <p className="field__hint">
        Bars longer than {MAX_STANDARD_ROD_FT} ft are built from several rods joined by a lap.
      </p>
      <MeasureField
        label="Lap length"
        measure={value.lap}
        onChange={(lap) => onChange({ lap })}
        placeholder="e.g. 60"
        hint={
          exceeds
            ? "Required: this bar is longer than one standard rod."
            : "Only used when the bar is longer than one standard rod."
        }
      />
    </div>
  );
}

interface RodPlanSummaryProps {
  plan: RodPlanResult;
  count: number;
}

export function RodPlanSummary({ plan, count }: RodPlanSummaryProps) {
  return (
    <ResultCard title={`Rod plan – ${count} bar${count === 1 ? "" : "s"} of this type`}>
      <ResultRow
        label="Original required length"
        value={`${fmt(plan.requiredLengthM)} m (${fmt(plan.requiredLengthFt)} ft)`}
      />
      <ResultRow
        label="Exceeds standard rod?"
        value={plan.exceedsStandard ? "Yes – lapping applied" : "No – single rod"}
      />
      {plan.exceedsStandard && (
        <>
          <ResultRow label="Pieces per bar" value={`${plan.piecesPerBar}`} />
          <ResultRow label="Lap length added per bar" value={`${fmt(plan.lapAddedPerBarM)} m`} />
        </>
      )}
      <ResultRow
        label="Final calculated length per bar"
        value={`${fmt(plan.finalLengthPerBarM)} m (${fmt(plan.finalLengthPerBarFt)} ft)`}
        emphasis
      />
      <ResultRow label="Total standard rods (39.5 ft)" value={`${plan.totalStandardRods}`} />
      <ResultRow label="Net steel weight" value={`${fmt(plan.netWeightKg)} kg`} emphasis />
      <ResultRow label="Purchased steel weight" value={`${fmt(plan.purchasedWeightKg)} kg`} />
    </ResultCard>
  );
}
