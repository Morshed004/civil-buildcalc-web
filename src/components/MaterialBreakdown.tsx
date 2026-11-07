import { ResultCard, ResultRow } from "./ResultCard";
import { fmt } from "@/lib/format";
import { CEMENT_BAG_KG, type ConcreteMaterials } from "@/lib/materials";

interface MaterialBreakdownProps {
  materials: ConcreteMaterials;
}

/** Cement, sand and aggregate quantities for a concrete volume and mix ratio. */
export function MaterialBreakdown({ materials: m }: MaterialBreakdownProps) {
  return (
    <>
      <ResultCard title={`Material quantities · mix ${m.ratioLabel}`} highlight>
        <ResultRow label="Cement" value={`${m.cementBags} bags`} emphasis />
        <ResultRow label={`Cement weight (${CEMENT_BAG_KG} kg per bag)`} value={`${fmt(m.cementKg, 0)} kg`} />
        <ResultRow label="Sand" value={`${fmt(m.sandCft)} CFT`} emphasis />
        <ResultRow label="Stone chips / aggregate (khuya)" value={`${fmt(m.aggregateCft)} CFT`} emphasis />
      </ResultCard>

      <ResultCard title="Volume basis">
        <ResultRow label="Net wet concrete" value={`${fmt(m.netWetCft)} CFT · ${fmt(m.netWetM3, 3)} m³`} />
        <ResultRow
          label={`Wet concrete with ${m.wastagePercent}% wastage`}
          value={`${fmt(m.designWetCft)} CFT · ${fmt(m.designWetM3, 3)} m³`}
        />
        <ResultRow label="Dry volume" value={`${fmt(m.dryCft)} CFT`} />
        <ResultRow label="Dry cement volume" value={`${fmt(m.cementCft)} CFT`} />
      </ResultCard>

      <p className="note">
        Cement bags are rounded up to whole bags. Dry volume = wet volume × {m.dryFactor}.
        One bag = {m.bagVolumeCft} CFT. Sand and aggregate are shown in CFT of dry material.
      </p>
    </>
  );
}
