import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import DispenserList from "@/components/ui/DispenserList";
import type { DispenserListEntry, DispenserSortMode } from "@/lib/types";

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
    imageUrls: ["/images/dsp-1.jpg", "/images/dsp-1-2.jpg"],
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
    coldWaterStatus: "Unavailable",
    maintenanceStatus: "Under Maintenance",
    imageUrls: [],
  },
];

function renderDispenserList(overrides?: {
  sortMode?: DispenserSortMode;
  isNearestSortAvailable?: boolean;
  selectedDispenserId?: string | null;
  searchQuery?: string;
  onSearchQueryChange?: (value: string) => void;
  onSortModeChange?: (mode: DispenserSortMode) => void;
  onSelectDispenser?: (dispenserId: string) => void;
}) {
  return render(
    <DispenserList
      entries={ENTRIES}
      selectedDispenserId={overrides?.selectedDispenserId ?? null}
      searchQuery={overrides?.searchQuery ?? ""}
      sortMode={overrides?.sortMode ?? "building_asc"}
      isNearestSortAvailable={overrides?.isNearestSortAvailable ?? true}
      onSearchQueryChange={overrides?.onSearchQueryChange ?? vi.fn()}
      onSortModeChange={overrides?.onSortModeChange ?? vi.fn()}
      onSelectDispenser={overrides?.onSelectDispenser ?? vi.fn()}
    />
  );
}

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
    renderDispenserList();

    const desktopPanel = within(screen.getByTestId("dispenser-list-desktop"));
    expect(desktopPanel.getByText("1st Floor Pantry")).toBeInTheDocument();
    expect(desktopPanel.getByText("Computer School")).toBeInTheDocument();
    expect(desktopPanel.getByText("1 Floor")).toBeInTheDocument();
    expect(desktopPanel.getByText("Near the main lift lobby")).toBeInTheDocument();
    expect(desktopPanel.getByText("Operational")).toBeInTheDocument();
    expect(desktopPanel.getByText("Cold Water")).toBeInTheDocument();
    expect(desktopPanel.getByText("No Cold Water")).toBeInTheDocument();
    expect(desktopPanel.queryByAltText("1st Floor Pantry dispenser")).not.toBeInTheDocument();
    expect(desktopPanel.queryByLabelText("No image uploaded")).not.toBeInTheDocument();
  });

  it("shows image panel only for selected dispenser", () => {
    renderDispenserList({ selectedDispenserId: "dsp-1" });

    const desktopPanel = within(screen.getByTestId("dispenser-list-desktop"));
    expect(desktopPanel.getByAltText("1st Floor Pantry dispenser")).toBeInTheDocument();
    expect(desktopPanel.queryByLabelText("No image uploaded")).not.toBeInTheDocument();
  });

  it("invokes onSelectDispenser when item is clicked", () => {
    const onSelectDispenser = vi.fn();
    renderDispenserList({ onSelectDispenser });

    const desktopPanel = within(screen.getByTestId("dispenser-list-desktop"));
    fireEvent.click(desktopPanel.getByRole("button", { name: /Open 1st Floor Pantry in Computer School/i }));
    expect(onSelectDispenser).toHaveBeenCalledWith("dsp-1");
  });

  it("invokes onSelectDispenser when item is selected from keyboard", () => {
    const onSelectDispenser = vi.fn();
    renderDispenserList({ onSelectDispenser });

    const desktopPanel = within(screen.getByTestId("dispenser-list-desktop"));
    const targetRow = desktopPanel.getByRole("button", {
      name: /Open 1st Floor Pantry in Computer School/i,
    });

    targetRow.focus();
    fireEvent.keyDown(targetRow, { key: "Enter" });
    fireEvent.keyDown(targetRow, { key: " " });

    expect(onSelectDispenser).toHaveBeenNthCalledWith(1, "dsp-1");
    expect(onSelectDispenser).toHaveBeenNthCalledWith(2, "dsp-1");
  });

  it("does not select dispenser when slider navigation controls are clicked", () => {
    const onSelectDispenser = vi.fn();
    renderDispenserList({ selectedDispenserId: "dsp-1", onSelectDispenser });

    const desktopPanel = within(screen.getByTestId("dispenser-list-desktop"));
    fireEvent.click(desktopPanel.getByRole("button", { name: "Next dispenser image" }));

    expect(onSelectDispenser).not.toHaveBeenCalled();
  });

  it("reflects selected result state", () => {
    renderDispenserList({ selectedDispenserId: "dsp-2" });

    const desktopPanel = within(screen.getByTestId("dispenser-list-desktop"));
    expect(
      desktopPanel.getByRole("button", { name: /Open Ground Floor Pantry in Library/i })
    ).toHaveAttribute("aria-pressed", "true");
  });

  it("passes search updates to callback", () => {
    const onSearchQueryChange = vi.fn();
    renderDispenserList({ onSearchQueryChange });

    const desktopPanel = within(screen.getByTestId("dispenser-list-desktop"));
    fireEvent.change(desktopPanel.getByLabelText("Search dispenser list"), {
      target: { value: "library" },
    });
    expect(onSearchQueryChange).toHaveBeenCalledWith("library");
  });

  it("keeps a dispenser preview visible in mobile peek state", () => {
    renderDispenserList();

    const mobilePanel = within(screen.getByTestId("dispenser-list-mobile"));
    fireEvent.keyDown(mobilePanel.getByRole("button", { name: "Drag dispenser results sheet" }), {
      key: "ArrowDown",
    });

    expect(
      mobilePanel.getByRole("button", { name: /Open 1st Floor Pantry in Computer School/i })
    ).toBeInTheDocument();
    expect(mobilePanel.getByText("Pull up to view more results.")).toBeInTheDocument();
  });

  it("renders sort control and disables nearest when location is unavailable", () => {
    renderDispenserList({ sortMode: "nearest", isNearestSortAvailable: false });

    expect(screen.getAllByLabelText("Sort dispenser list")[0]).toHaveValue("nearest");
    expect(screen.getAllByText("Enable location to use Nearest.").length).toBeGreaterThan(0);
  });

  it("invokes sort callback when sort mode changes", () => {
    const onSortModeChange = vi.fn();
    renderDispenserList({ onSortModeChange });

    fireEvent.change(screen.getAllByLabelText("Sort dispenser list")[0], {
      target: { value: "nearest" },
    });

    expect(onSortModeChange).toHaveBeenCalledWith("nearest");
  });
});
