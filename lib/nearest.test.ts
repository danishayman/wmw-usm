import { describe, expect, it } from "vitest";
import { findNearestBuildingWithDispenser } from "@/lib/nearest";
import type { Building, LatLng } from "@/lib/types";

const BASE_BUILDINGS: Building[] = [
  {
    id: "bld-a",
    name: "Alpha Hall",
    latitude: 5.3562,
    longitude: 100.2992,
    dispensers: [
      {
        id: "d-a-1",
        buildingId: "bld-a",
        locationDescription: "Level 1 Pantry",
        brand: "Coway",
        coldWaterStatus: "Available",
        maintenanceStatus: "Operational",
      },
    ],
  },
  {
    id: "bld-b",
    name: "Beta Hall",
    latitude: 5.3575,
    longitude: 100.3014,
    dispensers: [
      {
        id: "d-b-1",
        buildingId: "bld-b",
        locationDescription: "Lobby",
        brand: "Cuckoo",
        coldWaterStatus: "Available",
        maintenanceStatus: "Operational",
      },
    ],
  },
];

describe("findNearestBuildingWithDispenser", () => {
  it("returns null when user location is missing", () => {
    expect(findNearestBuildingWithDispenser(null, BASE_BUILDINGS)).toBeNull();
  });

  it("returns null when there are no buildings with dispensers", () => {
    const buildingsWithoutDispensers = BASE_BUILDINGS.map((building) => ({
      ...building,
      dispensers: [],
    }));

    expect(
      findNearestBuildingWithDispenser(
        { lat: 5.3563, lng: 100.2994 },
        buildingsWithoutDispensers
      )
    ).toBeNull();
  });

  it("returns the nearest building among multiple candidates", () => {
    const userLocation: LatLng = { lat: 5.35615, lng: 100.2991 };

    const result = findNearestBuildingWithDispenser(userLocation, BASE_BUILDINGS);

    expect(result).not.toBeNull();
    expect(result?.buildingId).toBe("bld-a");
    expect(result?.distanceMeters).toBeGreaterThan(0);
  });

  it("ignores buildings that have no dispensers", () => {
    const userLocation: LatLng = { lat: 5.35749, lng: 100.30139 };
    const buildings = [
      ...BASE_BUILDINGS,
      {
        id: "bld-empty-nearby",
        name: "Empty Nearby",
        latitude: 5.3574901,
        longitude: 100.3013901,
        dispensers: [],
      },
    ];

    const result = findNearestBuildingWithDispenser(userLocation, buildings);
    expect(result?.buildingId).toBe("bld-b");
  });

  it("uses building name as deterministic tie-breaker", () => {
    const userLocation: LatLng = { lat: 5.35, lng: 100.3 };
    const equidistantBuildings: Building[] = [
      {
        id: "z-id",
        name: "Zulu Block",
        latitude: 5.351,
        longitude: 100.3,
        dispensers: [
          {
            id: "z-1",
            buildingId: "z-id",
            locationDescription: "Z",
            brand: "Coway",
            coldWaterStatus: "Available",
            maintenanceStatus: "Operational",
          },
        ],
      },
      {
        id: "a-id",
        name: "Alpha Block",
        latitude: 5.349,
        longitude: 100.3,
        dispensers: [
          {
            id: "a-1",
            buildingId: "a-id",
            locationDescription: "A",
            brand: "Coway",
            coldWaterStatus: "Available",
            maintenanceStatus: "Operational",
          },
        ],
      },
    ];

    const result = findNearestBuildingWithDispenser(userLocation, equidistantBuildings);
    expect(result?.buildingId).toBe("a-id");
  });
});
