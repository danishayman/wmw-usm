import type { Building, LatLng, NearestBuildingResult } from "@/lib/types";

const EARTH_RADIUS_METERS = 6_371_000;

function toRadians(value: number) {
  return (value * Math.PI) / 180;
}

export function haversineDistanceMeters(from: LatLng, to: LatLng): number {
  const latitudeDelta = toRadians(to.lat - from.lat);
  const longitudeDelta = toRadians(to.lng - from.lng);
  const fromLatitude = toRadians(from.lat);
  const toLatitude = toRadians(to.lat);

  const arc =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) * Math.cos(toLatitude) * Math.sin(longitudeDelta / 2) ** 2;

  return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(arc), Math.sqrt(1 - arc));
}

export function findNearestBuildingWithDispenser(
  userLocation: LatLng | null,
  buildings: Building[]
): NearestBuildingResult | null {
  if (!userLocation) {
    return null;
  }

  const eligibleBuildings = buildings.filter((building) => building.dispensers.length > 0);
  if (eligibleBuildings.length === 0) {
    return null;
  }

  const rankedBuildings = eligibleBuildings
    .map((building) => ({
      buildingId: building.id,
      buildingName: building.name,
      distanceMeters: haversineDistanceMeters(userLocation, {
        lat: building.latitude,
        lng: building.longitude,
      }),
    }))
    .sort((left, right) => {
      if (left.distanceMeters !== right.distanceMeters) {
        return left.distanceMeters - right.distanceMeters;
      }

      return left.buildingName.localeCompare(right.buildingName);
    });

  const closest = rankedBuildings[0];
  return {
    buildingId: closest.buildingId,
    distanceMeters: closest.distanceMeters,
  };
}
