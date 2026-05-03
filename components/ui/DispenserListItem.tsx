"use client";

import { MapPin } from "lucide-react";
import { MaintenanceBadge } from "@/components/ui/StatusBadge";
import type { DispenserListEntry } from "@/lib/types";

interface DispenserListItemProps {
  dispenser: DispenserListEntry;
  isSelected: boolean;
  onSelect: (dispenserId: string) => void;
}

export default function DispenserListItem({
  dispenser,
  isSelected,
  onSelect,
}: DispenserListItemProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(dispenser.dispenserId)}
      className={`w-full rounded-2xl border px-4 py-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] ${
        isSelected
          ? "border-[#b88ce2] bg-[#f6efff] shadow-[0_14px_30px_-24px_rgba(67,26,124,0.95)]"
          : "border-[#ded2ef] bg-white hover:border-[#c5ade5]"
      }`}
      aria-pressed={isSelected}
      aria-label={`Open ${dispenser.locationDescription} in ${dispenser.buildingName}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-base font-bold text-[#2f1d4f]">
            {dispenser.locationDescription}
          </h3>
          <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-[#5a4973]">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{dispenser.buildingName}</span>
          </p>
          {dispenser.floor && (
            <p className="mt-1 text-xs font-semibold tracking-wide text-[#6f5b8a] uppercase">
              {dispenser.floor}
            </p>
          )}
        </div>
        <div className="shrink-0">
          <MaintenanceBadge status={dispenser.maintenanceStatus} />
        </div>
      </div>
      {dispenser.shortDescription && (
        <p className="mt-2 text-sm text-[#4a3a66]">{dispenser.shortDescription}</p>
      )}
    </button>
  );
}
