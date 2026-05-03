"use client";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
} from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import DispenserListItem from "@/components/ui/DispenserListItem";
import type { DispenserListEntry, DispenserSortMode } from "@/lib/types";

type MobileSnap = "peek" | "half" | "full";

type SheetMetrics = {
  fullHeight: number;
  peekHeight: number;
  halfHeight: number;
};

type DragState = {
  active: boolean;
  pointerId: number | null;
  startY: number;
  startTranslate: number;
};

interface DispenserListProps {
  entries: DispenserListEntry[];
  selectedDispenserId: string | null;
  searchQuery: string;
  sortMode: DispenserSortMode;
  isNearestSortAvailable: boolean;
  onSearchQueryChange: (value: string) => void;
  onSortModeChange: (mode: DispenserSortMode) => void;
  onSelectDispenser: (dispenserId: string) => void;
  isDesktopCollapsed?: boolean;
  onToggleDesktopCollapsed?: () => void;
}

const DEFAULT_SNAP: MobileSnap = "half";
const DEFAULT_METRICS: SheetMetrics = {
  fullHeight: 620,
  peekHeight: 188,
  halfHeight: 364,
};

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function buildMetrics(viewportHeight: number): SheetMetrics {
  const topGap = clamp(viewportHeight * 0.12, 84, 144);
  const fullHeight = Math.max(320, viewportHeight - topGap);
  const peekHeight = clamp(viewportHeight * 0.22, 148, 216);

  let halfHeight = clamp(viewportHeight * 0.52, 300, fullHeight - 56);
  halfHeight = Math.max(halfHeight, Math.min(fullHeight - 56, peekHeight + 112));
  halfHeight = Math.min(halfHeight, fullHeight - 56);

  return {
    fullHeight,
    peekHeight,
    halfHeight,
  };
}

function getSnapTranslate(snap: MobileSnap, metrics: SheetMetrics) {
  if (snap === "full") {
    return 0;
  }

  if (snap === "half") {
    return metrics.fullHeight - metrics.halfHeight;
  }

  return metrics.fullHeight - metrics.peekHeight;
}

function SearchInput({
  searchQuery,
  onSearchQueryChange,
}: {
  searchQuery: string;
  onSearchQueryChange: (value: string) => void;
}) {
  return (
    <label className="relative block">
      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#6b5d82]" />
      <input
        type="search"
        value={searchQuery}
        onChange={(event) => onSearchQueryChange(event.target.value)}
        placeholder="Search by name, building, floor, description"
        className="w-full rounded-xl border border-[#d2c3e8] bg-white py-2 pr-3 pl-9 text-sm text-[#2f2050] outline-none placeholder:text-[#6b5d82] focus:border-[#8b65c6] focus:ring-2 focus:ring-[#8b65c6]/20"
        aria-label="Search dispenser list"
      />
    </label>
  );
}

function SortControl({
  sortMode,
  isNearestSortAvailable,
  onSortModeChange,
}: {
  sortMode: DispenserSortMode;
  isNearestSortAvailable: boolean;
  onSortModeChange: (mode: DispenserSortMode) => void;
}) {
  return (
    <div>
      <label className="block text-[11px] font-bold tracking-wide text-[#5a4973] uppercase">
        Sort
      </label>
      <select
        value={sortMode}
        onChange={(event) => onSortModeChange(event.target.value as DispenserSortMode)}
        className="mt-1 w-full rounded-xl border border-[#d2c3e8] bg-white px-3 py-2 text-sm font-semibold text-[#2f2050] outline-none focus:border-[#8b65c6] focus:ring-2 focus:ring-[#8b65c6]/20"
        aria-label="Sort dispenser list"
      >
        <option value="nearest" disabled={!isNearestSortAvailable}>
          Nearest
        </option>
        <option value="building_asc">A-Z by building</option>
      </select>
      {!isNearestSortAvailable && (
        <p className="mt-1 text-[11px] font-semibold text-[#6f5b8a]">
          Enable location to use Nearest.
        </p>
      )}
    </div>
  );
}

export default function DispenserList({
  entries,
  selectedDispenserId,
  searchQuery,
  sortMode,
  isNearestSortAvailable,
  onSearchQueryChange,
  onSortModeChange,
  onSelectDispenser,
  isDesktopCollapsed = false,
  onToggleDesktopCollapsed = () => {},
}: DispenserListProps) {
  const [mobileSnap, setMobileSnap] = useState<MobileSnap>(DEFAULT_SNAP);
  const [metrics, setMetrics] = useState<SheetMetrics>(DEFAULT_METRICS);
  const [dragTranslate, setDragTranslate] = useState<number | null>(null);
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const dragRef = useRef<DragState>({
    active: false,
    pointerId: null,
    startY: 0,
    startTranslate: 0,
  });

  useEffect(() => {
    const updateMetrics = () => {
      setMetrics(buildMetrics(window.innerHeight));
    };

    updateMetrics();
    window.addEventListener("resize", updateMetrics);

    return () => {
      window.removeEventListener("resize", updateMetrics);
    };
  }, []);

  useEffect(() => {
    if (!selectedDispenserId) {
      return;
    }

    const targetRow = rowRefs.current[selectedDispenserId];
    if (!targetRow || typeof targetRow.scrollIntoView !== "function") {
      return;
    }

    targetRow.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [selectedDispenserId]);

  const snapTranslate = useMemo(
    () => getSnapTranslate(mobileSnap, metrics),
    [mobileSnap, metrics]
  );
  const isDragging = dragTranslate !== null;
  const effectiveTranslate = dragTranslate ?? snapTranslate;
  const isPeek = mobileSnap === "peek" && !isDragging;
  const mobileVisibleEntries = useMemo(() => {
    if (!isPeek) {
      return entries;
    }

    if (selectedDispenserId) {
      const selectedEntry = entries.find((entry) => entry.dispenserId === selectedDispenserId);
      if (selectedEntry) {
        return [selectedEntry];
      }
    }

    return entries.slice(0, 1);
  }, [entries, isPeek, selectedDispenserId]);

  const finishDrag = (pointerEvent: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag.active || drag.pointerId !== pointerEvent.pointerId) {
      return;
    }

    const currentTranslate = clamp(
      drag.startTranslate + (pointerEvent.clientY - drag.startY),
      -28,
      metrics.fullHeight + 120
    );

    dragRef.current = {
      active: false,
      pointerId: null,
      startY: 0,
      startTranslate: 0,
    };

    if (pointerEvent.currentTarget.hasPointerCapture(pointerEvent.pointerId)) {
      pointerEvent.currentTarget.releasePointerCapture(pointerEvent.pointerId);
    }

    const translated = Math.max(0, currentTranslate);
    const candidates: Array<{ snap: MobileSnap; value: number }> = [
      { snap: "full", value: getSnapTranslate("full", metrics) },
      { snap: "half", value: getSnapTranslate("half", metrics) },
      { snap: "peek", value: getSnapTranslate("peek", metrics) },
    ];

    let nextSnap: MobileSnap = mobileSnap;
    let minDistance = Number.POSITIVE_INFINITY;

    for (const candidate of candidates) {
      const distance = Math.abs(translated - candidate.value);
      if (distance < minDistance) {
        minDistance = distance;
        nextSnap = candidate.snap;
      }
    }

    setMobileSnap(nextSnap);
    setDragTranslate(null);
  };

  const onDragStart = (event: PointerEvent<HTMLDivElement>) => {
    if (event.pointerType === "mouse" && event.button !== 0) {
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    dragRef.current = {
      active: true,
      pointerId: event.pointerId,
      startY: event.clientY,
      startTranslate: snapTranslate,
    };
    setDragTranslate(snapTranslate);
  };

  const onDragMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag.active || drag.pointerId !== event.pointerId) {
      return;
    }

    const nextTranslate = clamp(
      drag.startTranslate + (event.clientY - drag.startY),
      -28,
      metrics.fullHeight + 120
    );
    setDragTranslate(nextTranslate);
  };

  const onHandleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setMobileSnap((current) => (current === "peek" ? "half" : "full"));
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setMobileSnap((current) => (current === "full" ? "half" : "peek"));
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setMobileSnap((current) => {
        if (current === "peek") {
          return "half";
        }

        if (current === "half") {
          return "full";
        }

        return "peek";
      });
    }
  };

  return (
    <>
      <aside
        data-testid="dispenser-list-desktop"
        className={`fixed top-0 left-0 z-[2000] hidden h-full w-[26rem] border-r border-[#d2c4e6] bg-white transition-transform duration-300 ease-out md:block ${isDesktopCollapsed ? "-translate-x-full" : "translate-x-0"}`}
      >
        <button
          type="button"
          onClick={onToggleDesktopCollapsed}
          aria-label="Collapse sidebar"
          aria-pressed={isDesktopCollapsed}
          className="absolute top-1/2 right-0 z-[2050] hidden h-16 w-8 -translate-y-1/2 translate-x-full items-center justify-center rounded-r-xl border border-l-0 border-[#cdbde4] bg-white text-[#4b2a7d] shadow-[0_10px_20px_-16px_rgba(67,26,124,0.9)] transition hover:bg-[#f8f3ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] md:flex"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex h-full flex-col">
          <div className="border-b border-[#dccff0] bg-gradient-to-b from-[#f6f0ff] to-white px-5 py-4">
            <h2 className="font-display text-[1.55rem] leading-tight font-bold text-[#301a55]">
              Results
            </h2>
            <p className="mt-1 text-sm font-semibold text-[#5a4973]">
              {entries.length} dispenser{entries.length === 1 ? "" : "s"}
            </p>
            <div className="mt-3">
              <SearchInput
                searchQuery={searchQuery}
                onSearchQueryChange={onSearchQueryChange}
              />
            </div>
            <div className="mt-3">
              <SortControl
                sortMode={sortMode}
                isNearestSortAvailable={isNearestSortAvailable}
                onSortModeChange={onSortModeChange}
              />
            </div>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-3">
            {entries.map((entry) => (
              <div
                key={entry.dispenserId}
                ref={(element) => {
                  rowRefs.current[entry.dispenserId] = element;
                }}
              >
                <DispenserListItem
                  dispenser={entry}
                  isSelected={selectedDispenserId === entry.dispenserId}
                  onSelect={onSelectDispenser}
                />
              </div>
            ))}
            {entries.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[#d8cdea] bg-[#f8f3ff] px-5 py-8 text-center">
                <p className="font-semibold text-[#4a3a66]">
                  No dispensers matched your search.
                </p>
              </div>
            )}
          </div>
        </div>
      </aside>
      <button
        type="button"
        onClick={onToggleDesktopCollapsed}
        aria-label="Expand sidebar"
        aria-pressed={isDesktopCollapsed}
        className={`fixed top-1/2 left-0 z-[2050] hidden h-16 w-8 -translate-y-1/2 items-center justify-center rounded-r-xl border border-l-0 border-[#cdbde4] bg-white text-[#4b2a7d] shadow-[0_12px_24px_-16px_rgba(67,26,124,0.9)] transition-all duration-300 ease-out hover:bg-[#f8f3ff] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--ring)] md:flex ${
          isDesktopCollapsed
            ? "translate-x-0 opacity-100 delay-150"
            : "-translate-x-3 opacity-0 delay-0 pointer-events-none"
        }`}
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      <aside
        data-testid="dispenser-list-mobile"
        className="fixed inset-x-0 bottom-0 z-[2500] md:hidden"
        style={{
          height: `${metrics.fullHeight}px`,
          transform: `translateY(${effectiveTranslate}px)`,
          transition: isDragging ? "none" : "transform 360ms cubic-bezier(0.22,1,0.36,1)",
          willChange: "transform",
        }}
      >
        <div className="relative flex h-full flex-col overflow-hidden rounded-t-[30px] border-t border-[#d2c4e6] bg-white shadow-[0_-18px_45px_-26px_rgba(67,26,124,0.7)]">
          <div
            role="button"
            tabIndex={0}
            aria-label="Drag dispenser results sheet"
            className="cursor-grab select-none border-b border-[#d8cdea] bg-gradient-to-b from-[#f6f0ff] to-white px-4 pt-2 pb-3 active:cursor-grabbing"
            style={{ touchAction: "none" }}
            onPointerDown={onDragStart}
            onPointerMove={onDragMove}
            onPointerUp={finishDrag}
            onPointerCancel={finishDrag}
            onKeyDown={onHandleKeyDown}
          >
            <div className="mx-auto mb-2 h-1.5 w-12 rounded-full bg-[#d9cfee]" />
            <p className="text-sm font-bold text-[#301a55]">
              Results ({entries.length})
            </p>
            <div className="mt-2">
              <SearchInput
                searchQuery={searchQuery}
                onSearchQueryChange={onSearchQueryChange}
              />
            </div>
            <div className="mt-2">
              <SortControl
                sortMode={sortMode}
                isNearestSortAvailable={isNearestSortAvailable}
                onSortModeChange={onSortModeChange}
              />
            </div>
          </div>

          <div className={`min-h-0 flex-1 overflow-y-auto ${isPeek ? "space-y-1.5 px-3 pt-2 pb-3" : "space-y-2 p-3"}`}>
            {mobileVisibleEntries.map((entry) => (
              <div
                key={entry.dispenserId}
                ref={(element) => {
                  rowRefs.current[entry.dispenserId] = element;
                }}
              >
                <DispenserListItem
                  dispenser={entry}
                  isSelected={selectedDispenserId === entry.dispenserId}
                  onSelect={onSelectDispenser}
                />
              </div>
            ))}
            {entries.length === 0 && (
              <div className="rounded-2xl border border-dashed border-[#d8cdea] bg-[#f8f3ff] px-5 py-8 text-center">
                <p className="font-semibold text-[#4a3a66]">
                  No dispensers matched your search.
                </p>
              </div>
            )}
            {isPeek && entries.length > 1 && (
              <p className="px-1 text-xs font-semibold text-[#6f5b8a]">
                Pull up to view more results.
              </p>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
