import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import MapShell from "@/components/ui/MapShell";
import type { Building, DispenserListEntry } from "@/lib/types";

vi.mock("next/dynamic", () => ({
  default: () => {
    const MockedDynamicMap = (props: {
      dispenserEntries: DispenserListEntry[];
      selectedDispenserId: string | null;
      nearestBuildingId: string | null;
      isDesktopSidebarCollapsed: boolean;
      onDispenserSelect: (dispenserId: string) => void;
      onUserLocationChange: (location: { lat: number; lng: number } | null) => void;
    }) => (
      <div
        data-testid="mock-map"
        data-dispenser-count={String(props.dispenserEntries.length)}
        data-first-dispenser-id={props.dispenserEntries[0]?.dispenserId ?? ""}
        data-selected-dispenser-id={props.selectedDispenserId ?? ""}
        data-nearest-building-id={props.nearestBuildingId ?? ""}
        data-desktop-collapsed={String(props.isDesktopSidebarCollapsed)}
      >
        <button
          type="button"
          onClick={() => props.onUserLocationChange({ lat: 5.35619, lng: 100.29925 })}
        >
          Set user location
        </button>
        <button
          type="button"
          onClick={() => props.onUserLocationChange({ lat: 5.35781, lng: 100.30179 })}
        >
          Set user location near library
        </button>
        <button type="button" onClick={() => props.onDispenserSelect("dsp-2")}>
          Select marker dispenser two
        </button>
      </div>
    );

    return MockedDynamicMap;
  },
}));

const BUILDINGS: Building[] = [
  {
    id: "bld-empty",
    name: "Empty Building",
    latitude: 5.356191,
    longitude: 100.299251,
    dispensers: [],
  },
  {
    id: "bld-1",
    name: "Computer School",
    latitude: 5.3562,
    longitude: 100.2993,
    dispensers: [
      {
        id: "dsp-1",
        buildingId: "bld-1",
        locationDescription: "1st Floor Pantry",
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
    latitude: 5.3578,
    longitude: 100.3018,
    dispensers: [
      {
        id: "dsp-2",
        buildingId: "bld-2",
        locationDescription: "Ground Floor Pantry",
        brand: "Cuckoo",
        coldWaterStatus: "Available",
        maintenanceStatus: "Operational",
        imagePaths: [],
        imageUrls: [],
      },
    ],
  },
];

describe("MapShell dispenser list and map sync", () => {
  afterEach(() => {
    cleanup();
  });

  beforeEach(() => {
    window.localStorage.clear();
  });

  beforeAll(() => {
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: 900,
    });
  });

  it("shows all dispenser results by default", () => {
    render(<MapShell buildings={BUILDINGS} />);

    expect(screen.getByText("Results")).toBeInTheDocument();
    expect(screen.getByText("2 dispensers")).toBeInTheDocument();
    expect(screen.getByTestId("mock-map")).toHaveAttribute("data-dispenser-count", "2");
  });

  it("filters both list and map markers via search query", () => {
    render(<MapShell buildings={BUILDINGS} />);

    fireEvent.change(screen.getAllByLabelText("Search dispenser list")[0], {
      target: { value: "library" },
    });

    expect(screen.queryByRole("button", { name: /Open 1st Floor Pantry/i })).not.toBeInTheDocument();
    expect(
      screen.getAllByRole("button", { name: /Open Ground Floor Pantry in Library/i }).length
    ).toBeGreaterThan(0);
    expect(screen.getByTestId("mock-map")).toHaveAttribute("data-dispenser-count", "1");
  });

  it("selects dispenser from list and forwards selection to map", () => {
    render(<MapShell buildings={BUILDINGS} />);

    fireEvent.click(
      screen.getAllByRole("button", { name: /Open 1st Floor Pantry in Computer School/i })[0]
    );

    expect(screen.getByTestId("mock-map")).toHaveAttribute("data-selected-dispenser-id", "dsp-1");
    expect(
      screen.getAllByRole("button", { name: /Open 1st Floor Pantry in Computer School/i })[0]
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("updates selected list row when marker selection changes", () => {
    render(<MapShell buildings={BUILDINGS} />);

    fireEvent.click(screen.getByRole("button", { name: "Select marker dispenser two" }));

    expect(screen.getByTestId("mock-map")).toHaveAttribute("data-selected-dispenser-id", "dsp-2");
    expect(
      screen.getAllByRole("button", { name: /Open Ground Floor Pantry in Library/i })[0]
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("clears selected dispenser when search removes it from results", () => {
    render(<MapShell buildings={BUILDINGS} />);

    fireEvent.click(
      screen.getAllByRole("button", { name: /Open 1st Floor Pantry in Computer School/i })[0]
    );
    fireEvent.change(screen.getAllByLabelText("Search dispenser list")[0], {
      target: { value: "library" },
    });

    expect(screen.getByTestId("mock-map")).toHaveAttribute("data-selected-dispenser-id", "");
  });

  it("passes desktop sidebar collapse state to map", () => {
    render(<MapShell buildings={BUILDINGS} />);

    const map = screen.getByTestId("mock-map");
    expect(map).toHaveAttribute("data-desktop-collapsed", "false");

    fireEvent.click(screen.getByRole("button", { name: "Collapse sidebar" }));
    expect(map).toHaveAttribute("data-desktop-collapsed", "true");

    fireEvent.click(screen.getByRole("button", { name: "Expand sidebar" }));
    expect(map).toHaveAttribute("data-desktop-collapsed", "false");
  });

  it("defaults to building A-Z sort before location is available", () => {
    render(<MapShell buildings={BUILDINGS} />);

    expect(screen.getAllByLabelText("Sort dispenser list")[0]).toHaveValue("building_asc");
    expect(screen.getByTestId("mock-map")).toHaveAttribute("data-first-dispenser-id", "dsp-1");
  });

  it("switches to nearest sort by default after first location fix", () => {
    render(<MapShell buildings={BUILDINGS} />);

    fireEvent.click(screen.getByRole("button", { name: "Set user location near library" }));

    expect(screen.getAllByLabelText("Sort dispenser list")[0]).toHaveValue("nearest");
    expect(screen.getByTestId("mock-map")).toHaveAttribute("data-first-dispenser-id", "dsp-2");
  });

  it("restores persisted sort mode and keeps it after location updates", () => {
    window.localStorage.setItem("wmw:dispenser-sort-mode", "building_asc");
    render(<MapShell buildings={BUILDINGS} />);

    fireEvent.click(screen.getByRole("button", { name: "Set user location near library" }));

    expect(screen.getAllByLabelText("Sort dispenser list")[0]).toHaveValue("building_asc");
    expect(screen.getByTestId("mock-map")).toHaveAttribute("data-first-dispenser-id", "dsp-1");
  });
});
