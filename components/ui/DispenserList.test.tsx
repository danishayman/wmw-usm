import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import DispenserList from "@/components/ui/DispenserList";
import type { DispenserListEntry } from "@/lib/types";

const ENTRIES: DispenserListEntry[] = [
  {
    dispenserId: "dsp-1",
    buildingId: "bld-1",
    buildingName: "Computer School",
    latitude: 5.3562,
    longitude: 100.2993,
    locationDescription: "1st Floor Pantry",
    floor: "1 Floor",
    shortDescription: "Near the main lift lobby",
    brand: "Coway",
    coldWaterStatus: "Available",
    maintenanceStatus: "Operational",
    imageUrls: [],
  },
  {
    dispenserId: "dsp-2",
    buildingId: "bld-2",
    buildingName: "Library",
    latitude: 5.3578,
    longitude: 100.3018,
    locationDescription: "Ground Floor Pantry",
    floor: "Ground Floor",
    shortDescription: null,
    brand: "Cuckoo",
    coldWaterStatus: "Available",
    maintenanceStatus: "Under Maintenance",
    imageUrls: [],
  },
];

describe("DispenserList", () => {
  afterEach(() => {
    cleanup();
  });

  beforeAll(() => {
    Object.defineProperty(window, "innerHeight", {
      writable: true,
      configurable: true,
      value: 900,
    });

    Object.defineProperty(Element.prototype, "scrollIntoView", {
      writable: true,
      configurable: true,
      value: vi.fn(),
    });
  });

  it("renders dispenser cards with primary fields", () => {
    render(
      <DispenserList
        entries={ENTRIES}
        selectedDispenserId={null}
        searchQuery=""
        onSearchQueryChange={vi.fn()}
        onSelectDispenser={vi.fn()}
      />
    );

    const desktopPanel = within(screen.getByTestId("dispenser-list-desktop"));
    expect(desktopPanel.getByText("1st Floor Pantry")).toBeInTheDocument();
    expect(desktopPanel.getByText("Computer School")).toBeInTheDocument();
    expect(desktopPanel.getByText("1 Floor")).toBeInTheDocument();
    expect(desktopPanel.getByText("Near the main lift lobby")).toBeInTheDocument();
    expect(desktopPanel.getByText("Operational")).toBeInTheDocument();
  });

  it("invokes onSelectDispenser when item is clicked", () => {
    const onSelectDispenser = vi.fn();
    render(
      <DispenserList
        entries={ENTRIES}
        selectedDispenserId={null}
        searchQuery=""
        onSearchQueryChange={vi.fn()}
        onSelectDispenser={onSelectDispenser}
      />
    );

    const desktopPanel = within(screen.getByTestId("dispenser-list-desktop"));
    fireEvent.click(desktopPanel.getByRole("button", { name: /Open 1st Floor Pantry in Computer School/i }));
    expect(onSelectDispenser).toHaveBeenCalledWith("dsp-1");
  });

  it("reflects selected result state", () => {
    render(
      <DispenserList
        entries={ENTRIES}
        selectedDispenserId="dsp-2"
        searchQuery=""
        onSearchQueryChange={vi.fn()}
        onSelectDispenser={vi.fn()}
      />
    );

    const desktopPanel = within(screen.getByTestId("dispenser-list-desktop"));
    expect(
      desktopPanel.getByRole("button", { name: /Open Ground Floor Pantry in Library/i })
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("passes search updates to callback", () => {
    const onSearchQueryChange = vi.fn();
    render(
      <DispenserList
        entries={ENTRIES}
        selectedDispenserId={null}
        searchQuery=""
        onSearchQueryChange={onSearchQueryChange}
        onSelectDispenser={vi.fn()}
      />
    );

    const desktopPanel = within(screen.getByTestId("dispenser-list-desktop"));
    fireEvent.change(desktopPanel.getByLabelText("Search dispenser list"), {
      target: { value: "library" },
    });
    expect(onSearchQueryChange).toHaveBeenCalledWith("library");
  });
});
