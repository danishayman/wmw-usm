"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import type { Building } from "@/lib/types";
import { findNearestBuildingWithDispenser } from "@/lib/nearest";
import Sidebar from "@/components/ui/Sidebar";

const Map = dynamic(() => import("@/components/ui/Map"), {
  ssr: false,
});

interface MapShellProps {
  buildings: Building[];
}

export default function MapShell({ buildings }: MapShellProps) {
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const nearestBuilding = useMemo(
    () => findNearestBuildingWithDispenser(userLocation, buildings),
    [buildings, userLocation]
  );
  const nearestBuildingName =
    nearestBuilding &&
    buildings.find((building) => building.id === nearestBuilding.buildingId)?.name;
  const roundedNearestDistance =
    nearestBuilding && Number.isFinite(nearestBuilding.distanceMeters)
      ? Math.max(1, Math.round(nearestBuilding.distanceMeters))
      : null;

  return (
    <>
      {nearestBuilding && nearestBuildingName && roundedNearestDistance && (
        <div className="pointer-events-none absolute top-[8.85rem] left-1/2 z-[1050] w-[min(84vw,26rem)] -translate-x-1/2 sm:top-[9.2rem] sm:w-[min(88vw,30rem)] md:top-[12.5rem] md:w-[min(92vw,34rem)]">
          <div className="rounded-2xl border-2 border-[#0f766e] bg-white/98 px-4 py-2 text-center text-[13px] leading-tight font-extrabold text-[#0b3f3b] shadow-[0_18px_34px_-16px_rgba(6,110,101,0.9)] backdrop-blur-sm md:px-5 md:py-2.5 md:text-sm">
            Nearest dispenser: {nearestBuildingName} • {roundedNearestDistance} m
          </div>
        </div>
      )}
      <Sidebar
        key={selectedBuilding?.id ?? "sidebar-empty"}
        building={selectedBuilding}
        userLocation={userLocation}
        onClose={() => setSelectedBuilding(null)}
      />
      <div className="absolute inset-0 z-0">
        <Map
          buildings={buildings}
          selectedBuildingId={selectedBuilding?.id ?? null}
          nearestBuildingId={nearestBuilding?.buildingId ?? null}
          onBuildingSelect={setSelectedBuilding}
          userLocation={userLocation}
          onUserLocationChange={setUserLocation}
        />
      </div>
    </>
  );
}
