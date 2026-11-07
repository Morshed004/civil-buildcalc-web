import { ResultCard, ResultRow } from "./ResultCard";
import { fmt } from "@/lib/format";

interface ReinforcementSummaryProps {
  totalSteelKg: number;
  /** Number of main reinforcement bars. */
  mainBars: number;
  /** Standard 39.5 ft rods to purchase for the main bars. */
  standardRods: number;
  /** Stirrups, rings or ties. Omit when the element has none. */
  stirrups?: number;
  stirrupLabel?: string;
  stirrupSteelKg?: number;
}

export function ReinforcementSummary({
  totalSteelKg,
  mainBars,
  standardRods,
  stirrups,
  stirrupLabel = "Stirrups / rings",
  stirrupSteelKg,
}: ReinforcementSummaryProps) {
  return (
    <ResultCard title="Reinforcement schedule" highlight>
      <ResultRow label="Total steel required" value={`${fmt(totalSteelKg)} kg`} emphasis />
      <ResultRow label="Total steel (tonnes)" value={`${fmt(totalSteelKg / 1000, 3)} t`} />
      <ResultRow label="Main reinforcement bars" value={`${mainBars} pcs`} emphasis />
      <ResultRow label="Standard rods to purchase (39.5 ft)" value={`${standardRods} pcs`} />
      {stirrups !== undefined && (
        <ResultRow label={stirrupLabel} value={`${stirrups} pcs`} emphasis />
      )}
      {stirrupSteelKg !== undefined && (
        <ResultRow label={`${stirrupLabel} steel`} value={`${fmt(stirrupSteelKg)} kg`} />
      )}
    </ResultCard>
  );
}
