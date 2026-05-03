import { describe, expect, it } from "vitest";
import {
  buildDispenserListEntries,
  extractFloor,
  filterDispenserListEntries,
} from "@/lib/dispenser-list";
import type { Building } from "@/lib/types";

const BUILDINGS: Building[] = [
  {
    id: "bld-1",
    name: "Computer School",
    latitude: 5.3562,
    longitude: 100.2993,
    dispensers: [
      {
        id: "dsp-1",
        buildingId: "bld-1",
        locationDescription: "Level 2 Pantry",
        brand: "Coway",
        coldWaterStatus: "Available",
        maintenanceStatus: "Operational",
        imagePaths: [],
        imageUrls: [],
      },
    ],
  },
];

describe("dispenser-list utilities", () => {
  it("extracts floor heuristically", () => {
    expect(extractFloor("Ground Floor Pantry")).toBe("Ground Floor");
    expect(extractFloor("L3 near lift")).toBe("Level 3");
    expect(extractFloor("1st floor hall")).toBe("1 Floor");
  });

  it("builds dispenser entries with derived fields", () => {
    const entries = buildDispenserListEntries(BUILDINGS);

    expect(entries).toHaveLength(1);
    expect(entries[0]?.buildingName).toBe("Computer School");
    expect(entries[0]?.floor).toBe("Level 2");
  });

  it("filters entries using name, building, and floor", () => {
    const entries = buildDispenserListEntries(BUILDINGS);

    expect(filterDispenserListEntries(entries, "computer")).toHaveLength(1);
    expect(filterDispenserListEntries(entries, "level 2")).toHaveLength(1);
    expect(filterDispenserListEntries(entries, "library")).toHaveLength(0);
  });
});
