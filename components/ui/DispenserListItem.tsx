"use client";

import { type KeyboardEvent, useEffect, useState } from "react";
import { MapPin } from "lucide-react";
import DispenserImageSlider from "@/components/ui/DispenserImageSlider";
import { ColdWaterBadge, MaintenanceBadge } from "@/components/ui/StatusBadge";
import type { DispenserListEntry } from "@/lib/types";

interface DispenserListItemProps {
  dispenser: DispenserListEntry;
  isSelected: boolean;
  onSelect: (dispenserId: string) => void;
}

const IMAGE_PANEL_ANIMATION_MS = 460;

export default function DispenserListItem({
  dispenser,
  isSelected,
  onSelect,
}: DispenserListItemProps) {
  const [shouldRenderImagePanel, setShouldRenderImagePanel] = useState(isSelected);
  const [isImagePanelExpanded, setIsImagePanelExpanded] = useState(isSelected);

  useEffect(() => {
    if (isSelected) {
      setShouldRenderImagePanel(true);

      const frameId = window.requestAnimationFrame(() => {
        setIsImagePanelExpanded(true);
      });

      return () => {
        window.cancelAnimationFrame(frameId);
      };
    }

    setIsImagePanelExpanded(false);

    const timeoutId = window.setTimeout(() => {
      setShouldRenderImagePanel(false);
    }, IMAGE_PANEL_ANIMATION_MS);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }, [isSelected]);

  const selectDispenser = () => {
    onSelect(dispenser.dispenserId);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    selectDispenser();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={selectDispenser}
      onKeyDown={handleKeyDown}
      className={`w-full rounded-2xl border px-4 py-3 text-left transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] ${
        isSelected
          ? "border-[#b88ce2] bg-[#f6efff] shadow-[0_14px_30px_-24px_rgba(67,26,124,0.95)]"
          : "border-[#ded2ef] bg-white hover:border-[#c5ade5]"
      }`}
      aria-pressed={isSelected}
      aria-label={`Open ${dispenser.locationDescription} in ${dispenser.buildingName}`}
    >
      {shouldRenderImagePanel ? (
        <div
          className={`overflow-hidden transition-[max-height,opacity,transform,margin] duration-[460ms] ease-[cubic-bezier(0.16,1,0.3,1)] ${
            isImagePanelExpanded
              ? "mb-3 max-h-72 translate-y-0 opacity-100"
              : "mb-0 max-h-0 -translate-y-1 opacity-0"
          }`}
          aria-hidden={!isImagePanelExpanded}
        >
          <DispenserImageSlider
            imageUrls={dispenser.imageUrls}
            alt={`${dispenser.locationDescription} dispenser`}
            emptyLabel="No image uploaded"
            className="relative aspect-[4/3] w-full overflow-hidden rounded-xl border border-[#e2d8f0] bg-[#f8f3ff]"
            imageClassName="h-full w-full object-cover"
            emptyClassName="flex aspect-[4/3] w-full items-center justify-center rounded-xl border border-dashed border-[#d8cdea] bg-[#f8f3ff] text-[11px] font-semibold tracking-wide text-[#6c5f84] uppercase"
          />
        </div>
      ) : null}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="text-base leading-snug font-bold text-[#2f1d4f]">
            {dispenser.locationDescription}
          </h3>
          <p className="mt-1 flex items-center gap-1 text-sm font-semibold text-[#5a4973]">
            <MapPin className="h-3.5 w-3.5 shrink-0" />
            <span>{dispenser.buildingName}</span>
          </p>
          {dispenser.floor && (
            <p className="mt-1 text-xs font-semibold tracking-wide text-[#6f5b8a] uppercase">
              {dispenser.floor}
            </p>
          )}
        </div>
        <div className="shrink-0 flex flex-col items-end gap-1.5">
          <MaintenanceBadge status={dispenser.maintenanceStatus} />
          <ColdWaterBadge status={dispenser.coldWaterStatus} />
        </div>
      </div>
      {dispenser.shortDescription && (
        <p className="mt-2 text-sm text-[#4a3a66]">{dispenser.shortDescription}</p>
      )}
    </div>
  );
}
