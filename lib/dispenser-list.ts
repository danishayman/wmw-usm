import type { Building, DispenserListEntry } from "@/lib/types";

const FLOOR_PATTERNS: Array<{ pattern: RegExp; formatter: (match: RegExpMatchArray) => string }> = [
  {
    pattern: /\bground\s*floor\b/i,
    formatter: () => "Ground Floor",
  },
  {
    pattern: /\bgf\b/i,
    formatter: () => "Ground Floor",
  },
  {
    pattern: /\b(level|lvl|l)\s*(\d{1,2})\b/i,
    formatter: (match) => `Level ${match[2]}`,
  },
  {
    pattern: /\b(\d{1,2})(?:st|nd|rd|th)\s*floor\b/i,
    formatter: (match) => `${match[1]} Floor`,
  },
  {
    pattern: /\bfloor\s*(\d{1,2})\b/i,
    formatter: (match) => `${match[1]} Floor`,
  },
];

function normalize(value: string) {
  return value.trim().replace(/\s+/g, " ");
}

export function extractFloor(value: string): string | null {
  const normalized = normalize(value);

  for (const entry of FLOOR_PATTERNS) {
    const match = normalized.match(entry.pattern);
    if (match) {
      return entry.formatter(match);
    }
  }

  return null;
}

function extractShortDescription(value: string): string | null {
  const normalized = normalize(value);
  const floor = extractFloor(normalized);
  const withoutFloor = floor
    ? normalize(
        normalized
          .replace(/\bground\s*floor\b/gi, "")
          .replace(/\bgf\b/gi, "")
          .replace(/\b(level|lvl|l)\s*\d{1,2}\b/gi, "")
          .replace(/\b\d{1,2}(?:st|nd|rd|th)\s*floor\b/gi, "")
          .replace(/\bfloor\s*\d{1,2}\b/gi, "")
          .replace(/^[,.\-:;•\s]+|[,.\-:;•\s]+$/g, "")
      )
    : normalized;

  const parts = withoutFloor
    .split(/[-|•,]/g)
    .map((part) => normalize(part))
    .filter(Boolean);
  const bestPart = parts.find((part) => part.toLowerCase() !== normalized.toLowerCase()) ?? null;

  if (bestPart && bestPart.length > 2) {
    return bestPart;
  }

  if (withoutFloor && withoutFloor.toLowerCase() !== normalized.toLowerCase()) {
    return withoutFloor;
  }

  return null;
}

export function buildDispenserListEntries(buildings: Building[]): DispenserListEntry[] {
  return buildings.flatMap((building) =>
    building.dispensers.map((dispenser) => ({
      dispenserId: dispenser.id,
      buildingId: building.id,
      buildingName: building.name,
      latitude: building.latitude,
      longitude: building.longitude,
      locationDescription: normalize(dispenser.locationDescription),
      floor: extractFloor(dispenser.locationDescription),
      shortDescription: extractShortDescription(dispenser.locationDescription),
      brand: dispenser.brand,
      coldWaterStatus: dispenser.coldWaterStatus,
      maintenanceStatus: dispenser.maintenanceStatus,
      imageUrls: dispenser.imageUrls,
    }))
  );
}

function toSearchableText(entry: DispenserListEntry) {
  return [
    entry.locationDescription,
    entry.buildingName,
    entry.floor ?? "",
    entry.shortDescription ?? "",
  ]
    .join(" ")
    .toLowerCase();
}

export function filterDispenserListEntries(
  entries: DispenserListEntry[],
  searchQuery: string
): DispenserListEntry[] {
  const normalizedQuery = searchQuery.trim().toLowerCase();

  if (!normalizedQuery) {
    return entries;
  }

  return entries.filter((entry) => toSearchableText(entry).includes(normalizedQuery));
}
