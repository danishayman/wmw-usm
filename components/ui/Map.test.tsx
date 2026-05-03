import { act, cleanup, render, screen } from "@testing-library/react";
import { forwardRef, type ReactNode, useEffect } from "react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import Map from "@/components/ui/Map";
import type { Building, DispenserListEntry } from "@/lib/types";

const flyToMock = vi.fn();
const openPopupMock = vi.fn();
const watchPositionMock = vi.fn();
const clearWatchMock = vi.fn();
const GEOLOCATION_WATCH_ID = 91;
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
  Marker: forwardRef(function MockMarker(
    props: {
      icon?: { options?: { html?: string } };
      position: [number, number];
      eventHandlers?: { click?: () => void };
      children?: ReactNode;
    },
    ref: ((instance: { openPopup: () => void } | null) => void) | null
  ) {
    useEffect(() => {
      if (typeof ref === "function") {
        ref({ openPopup: openPopupMock });
      }

      return () => {
        if (typeof ref === "function") {
          ref(null);
        }
      };
    }, [ref]);

    return (
      <div
        data-testid={`marker-${props.position[0]}-${props.position[1]}`}
        data-icon-html={props.icon?.options?.html ?? ""}
        onClick={props.eventHandlers?.click}
      >
        {props.children}
      </div>
    );
  }),
  TileLayer: () => <div data-testid="tile-layer" />,
  ZoomControl: () => <div data-testid="zoom-control" />,
  Popup: ({ children }: { children: ReactNode }) => <div>{children}</div>,
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
        imagePaths: [],
        imageUrls: [],
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
        imagePaths: [],
        imageUrls: [],
      },
    ],
  },
];

const ENTRIES: DispenserListEntry[] = [
  {
    dispenserId: "dsp-1",
    buildingId: "bld-1",
    buildingName: "School of Computer Sciences",
    latitude: 5.3562,
    longitude: 100.2992,
    locationDescription: "Pantry",
    floor: null,
    shortDescription: null,
    brand: "Coway",
    coldWaterStatus: "Available",
    maintenanceStatus: "Operational",
    imageUrls: [],
  },
  {
    dispenserId: "dsp-2",
    buildingId: "bld-2",
    buildingName: "Library",
    latitude: 5.3574,
    longitude: 100.3015,
    locationDescription: "Ground Floor",
    floor: "Ground Floor",
    shortDescription: null,
    brand: "Cuckoo",
    coldWaterStatus: "Available",
    maintenanceStatus: "Operational",
    imageUrls: [],
  },
];

let geolocationSuccessHandler: PositionCallback | null = null;

function createMockPosition(lat: number, lng: number): GeolocationPosition {
  return {
    coords: {
      latitude: lat,
      longitude: lng,
      accuracy: 6,
      altitude: null,
      altitudeAccuracy: null,
      heading: null,
      speed: null,
      toJSON: () => ({}),
    },
    timestamp: 0,
    toJSON: () => ({}),
  };
}

function emitGeolocationSuccess(lat: number, lng: number) {
  if (!geolocationSuccessHandler) {
    throw new Error("Geolocation success callback is not registered.");
  }

  act(() => {
    geolocationSuccessHandler?.(createMockPosition(lat, lng));
  });
}

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

    Object.defineProperty(window.navigator, "geolocation", {
      configurable: true,
      value: {
        watchPosition: watchPositionMock,
        clearWatch: clearWatchMock,
      },
    });
  });

  beforeEach(() => {
    flyToMock.mockClear();
    openPopupMock.mockClear();
    watchPositionMock.mockReset();
    clearWatchMock.mockReset();
    geolocationSuccessHandler = null;

    watchPositionMock.mockImplementation((success: PositionCallback) => {
      geolocationSuccessHandler = success;
      return GEOLOCATION_WATCH_ID;
    });
  });

  it("applies nearest marker ring style to the nearest building marker", () => {
    render(
      <Map
        buildings={BUILDINGS}
        dispenserEntries={ENTRIES}
        onDispenserSelect={vi.fn()}
        selectedDispenserId={null}
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

  it("highlights selected marker when dispenser is selected", () => {
    render(
      <Map
        buildings={BUILDINGS}
        dispenserEntries={ENTRIES}
        onDispenserSelect={vi.fn()}
        selectedDispenserId="dsp-1"
        nearestBuildingId={null}
        userLocation={{ lat: 5.3561, lng: 100.2991 }}
        onUserLocationChange={vi.fn()}
      />
    );

    const selectedMarker = screen.getByTestId("marker-5.3562-100.2992");
    const html = selectedMarker.getAttribute("data-icon-html") ?? "";

    expect(html).toContain("#EB8423");
  });

  it("shows only markers for visible filtered buildings", () => {
    render(
      <Map
        buildings={BUILDINGS}
        dispenserEntries={[ENTRIES[0]]}
        onDispenserSelect={vi.fn()}
        selectedDispenserId={null}
        nearestBuildingId={null}
        userLocation={null}
        onUserLocationChange={vi.fn()}
      />
    );

    expect(screen.getByTestId("marker-5.3562-100.2992")).toBeInTheDocument();
    expect(screen.queryByTestId("marker-5.3574-100.3015")).not.toBeInTheDocument();
  });

  it("opens popup when selected dispenser changes", () => {
    const { rerender } = render(
      <Map
        buildings={BUILDINGS}
        dispenserEntries={ENTRIES}
        onDispenserSelect={vi.fn()}
        selectedDispenserId={null}
        nearestBuildingId={null}
        userLocation={null}
        onUserLocationChange={vi.fn()}
      />
    );

    rerender(
      <Map
        buildings={BUILDINGS}
        dispenserEntries={ENTRIES}
        onDispenserSelect={vi.fn()}
        selectedDispenserId="dsp-1"
        nearestBuildingId={null}
        userLocation={null}
        onUserLocationChange={vi.fn()}
      />
    );

    expect(openPopupMock).toHaveBeenCalled();
  });

  it("starts geolocation watch when map is ready", () => {
    render(
      <Map
        buildings={BUILDINGS}
        dispenserEntries={ENTRIES}
        onDispenserSelect={vi.fn()}
        selectedDispenserId={null}
        nearestBuildingId={null}
        userLocation={null}
        onUserLocationChange={vi.fn()}
      />
    );

    expect(watchPositionMock).toHaveBeenCalledTimes(1);
  });

  it("clears geolocation watch on unmount", () => {
    const { unmount } = render(
      <Map
        buildings={BUILDINGS}
        dispenserEntries={ENTRIES}
        onDispenserSelect={vi.fn()}
        selectedDispenserId={null}
        nearestBuildingId={null}
        userLocation={null}
        onUserLocationChange={vi.fn()}
      />
    );

    unmount();

    expect(clearWatchMock).toHaveBeenCalledWith(GEOLOCATION_WATCH_ID);
  });

  it("accepts first position update and centers camera once", () => {
    const onUserLocationChange = vi.fn();
    const nowSpy = vi.spyOn(Date, "now");

    nowSpy.mockReturnValue(1_000);

    render(
      <Map
        buildings={BUILDINGS}
        dispenserEntries={ENTRIES}
        onDispenserSelect={vi.fn()}
        selectedDispenserId={null}
        nearestBuildingId={null}
        userLocation={null}
        onUserLocationChange={onUserLocationChange}
      />
    );

    const flyToCountBeforeFirstFix = flyToMock.mock.calls.length;

    emitGeolocationSuccess(5.3561, 100.2991);

    expect(onUserLocationChange).toHaveBeenCalledTimes(1);
    expect(flyToMock.mock.calls.length).toBe(flyToCountBeforeFirstFix + 1);
    expect(flyToMock).toHaveBeenCalledWith([5.3561, 100.2991], 20, { duration: 1.2 });

    nowSpy.mockRestore();
  });

  it("ignores updates when movement is below 8 meters", () => {
    const onUserLocationChange = vi.fn();
    const nowSpy = vi.spyOn(Date, "now");

    nowSpy.mockReturnValueOnce(1_000).mockReturnValueOnce(7_000);

    render(
      <Map
        buildings={BUILDINGS}
        dispenserEntries={ENTRIES}
        onDispenserSelect={vi.fn()}
        selectedDispenserId={null}
        nearestBuildingId={null}
        userLocation={null}
        onUserLocationChange={onUserLocationChange}
      />
    );

    emitGeolocationSuccess(5.3561, 100.2991);
    emitGeolocationSuccess(5.35613, 100.2991);

    expect(onUserLocationChange).toHaveBeenCalledTimes(1);

    nowSpy.mockRestore();
  });

  it("ignores updates above 8 meters when less than 5 seconds have elapsed", () => {
    const onUserLocationChange = vi.fn();
    const nowSpy = vi.spyOn(Date, "now");

    nowSpy.mockReturnValueOnce(1_000).mockReturnValueOnce(4_000);

    render(
      <Map
        buildings={BUILDINGS}
        dispenserEntries={ENTRIES}
        onDispenserSelect={vi.fn()}
        selectedDispenserId={null}
        nearestBuildingId={null}
        userLocation={null}
        onUserLocationChange={onUserLocationChange}
      />
    );

    emitGeolocationSuccess(5.3561, 100.2991);
    emitGeolocationSuccess(5.3562, 100.2991);

    expect(onUserLocationChange).toHaveBeenCalledTimes(1);

    nowSpy.mockRestore();
  });

  it("accepts updates above 8 meters after at least 5 seconds", () => {
    const onUserLocationChange = vi.fn();
    const nowSpy = vi.spyOn(Date, "now");

    nowSpy.mockReturnValueOnce(1_000).mockReturnValueOnce(7_000);

    render(
      <Map
        buildings={BUILDINGS}
        dispenserEntries={ENTRIES}
        onDispenserSelect={vi.fn()}
        selectedDispenserId={null}
        nearestBuildingId={null}
        userLocation={null}
        onUserLocationChange={onUserLocationChange}
      />
    );

    emitGeolocationSuccess(5.3561, 100.2991);
    emitGeolocationSuccess(5.3562, 100.2991);

    expect(onUserLocationChange).toHaveBeenCalledTimes(2);
    expect(onUserLocationChange).toHaveBeenNthCalledWith(2, { lat: 5.3562, lng: 100.2991 });

    nowSpy.mockRestore();
  });

  it("does not auto-follow the camera after the first accepted position", () => {
    const onUserLocationChange = vi.fn();
    const nowSpy = vi.spyOn(Date, "now");

    nowSpy.mockReturnValueOnce(1_000).mockReturnValueOnce(7_000);

    render(
      <Map
        buildings={BUILDINGS}
        dispenserEntries={ENTRIES}
        onDispenserSelect={vi.fn()}
        selectedDispenserId={null}
        nearestBuildingId={null}
        userLocation={null}
        onUserLocationChange={onUserLocationChange}
      />
    );

    emitGeolocationSuccess(5.3561, 100.2991);

    const flyToCountAfterFirstFix = flyToMock.mock.calls.length;

    emitGeolocationSuccess(5.3562, 100.2991);

    expect(onUserLocationChange).toHaveBeenCalledTimes(2);
    expect(flyToMock.mock.calls.length).toBe(flyToCountAfterFirstFix);

    nowSpy.mockRestore();
  });
});
