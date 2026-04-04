import { cleanup, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Map from "@/components/ui/Map";
import type { Building } from "@/lib/types";

const flyToMock = vi.fn();
const mockedLeafletMap = {
  flyTo: flyToMock,
  getSize: () => ({ x: 1280, y: 720 }),
  project: () => ({
    subtract: () => ({}),
  }),
  unproject: () => ({ lat: 5.35, lng: 100.3 }),
};

vi.mock("leaflet", () => ({
  DivIcon: class {
    options: Record<string, unknown>;

    constructor(options: Record<string, unknown>) {
      this.options = options;
    }
  },
}));

vi.mock("react-leaflet", () => ({
  MapContainer: ({ children }: { children: ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  Marker: ({
    icon,
    position,
  }: {
    icon?: { options?: { html?: string } };
    position: [number, number];
  }) => (
    <div
      data-testid={`marker-${position[0]}-${position[1]}`}
      data-icon-html={icon?.options?.html ?? ""}
    />
  ),
  TileLayer: () => <div data-testid="tile-layer" />,
  ZoomControl: () => <div data-testid="zoom-control" />,
  useMap: () => mockedLeafletMap,
}));

const BUILDINGS: Building[] = [
  {
    id: "bld-1",
    name: "School of Computer Sciences",
    latitude: 5.3562,
    longitude: 100.2992,
    dispensers: [
      {
        id: "dsp-1",
        buildingId: "bld-1",
        locationDescription: "Pantry",
        brand: "Coway",
        coldWaterStatus: "Available",
        maintenanceStatus: "Operational",
      },
    ],
  },
  {
    id: "bld-2",
    name: "Library",
    latitude: 5.3574,
    longitude: 100.3015,
    dispensers: [
      {
        id: "dsp-2",
        buildingId: "bld-2",
        locationDescription: "Ground Floor",
        brand: "Cuckoo",
        coldWaterStatus: "Available",
        maintenanceStatus: "Operational",
      },
    ],
  },
];

describe("Map marker nearest-state rendering", () => {
  afterEach(() => {
    cleanup();
  });

  beforeAll(() => {
    Object.defineProperty(window, "matchMedia", {
      writable: true,
      value: vi.fn().mockImplementation(() => ({
        matches: false,
        media: "",
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      })),
    });
  });

  beforeEach(() => {
    flyToMock.mockClear();
  });

  it("applies nearest marker ring style to the nearest building marker", () => {
    render(
      <Map
        buildings={BUILDINGS}
        onBuildingSelect={vi.fn()}
        selectedBuildingId={null}
        nearestBuildingId="bld-1"
        userLocation={{ lat: 5.3561, lng: 100.2991 }}
        onUserLocationChange={vi.fn()}
      />
    );

    const nearestMarker = screen.getByTestId("marker-5.3562-100.2992");
    const regularMarker = screen.getByTestId("marker-5.3574-100.3015");

    expect(nearestMarker.getAttribute("data-icon-html")).toContain("rgba(13,148,136,0.95)");
    expect(regularMarker.getAttribute("data-icon-html")).not.toContain("rgba(13,148,136,0.95)");
  });

  it("keeps both selected and nearest visual cues when a marker is both", () => {
    render(
      <Map
        buildings={BUILDINGS}
        onBuildingSelect={vi.fn()}
        selectedBuildingId="bld-1"
        nearestBuildingId="bld-1"
        userLocation={{ lat: 5.3561, lng: 100.2991 }}
        onUserLocationChange={vi.fn()}
      />
    );

    const combinedMarker = screen.getByTestId("marker-5.3562-100.2992");
    const html = combinedMarker.getAttribute("data-icon-html") ?? "";

    expect(html).toContain("rgba(13,148,136,0.95)");
    expect(html).toContain("#EB8423");
  });
});
