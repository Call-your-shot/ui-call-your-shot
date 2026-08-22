// ---------------------------------------------------------------------------
// Pure geometry helpers for the Solar API integration.
//
// Two independent jobs live here:
//  1. computePanelCorners — Google gives us a panel's centre point and
//     orientation but not its corners. We reconstruct a rectangle sized to
//     the panel dimensions, rotated to the roof segment's azimuth, and
//     project it back to lat/lng.
//  2. projectLatLngToPixel — once we have real-world corners, we need to
//     place them on top of the flat Static Maps image. That image is a
//     standard Web Mercator tile, so this is the same math Google Maps
//     itself uses to go from a coordinate to a pixel.
//
// Both are intentionally free of any Next.js/React/fetch dependency so they
// can be unit tested in isolation — see geometry.test.ts.
// ---------------------------------------------------------------------------

export interface LatLng {
  lat: number;
  lng: number;
}

export type PanelOrientation = "PORTRAIT" | "LANDSCAPE";

const METERS_PER_DEGREE_LAT = 111_320;

/**
 * Converts a metre offset (dx = east, dy = north) from a reference latitude
 * into a lat/lng delta. Longitude degrees shrink toward the poles, hence the
 * cos(lat) term; latitude degrees are ~constant everywhere.
 */
export function metersToLatLngDelta(
  dx: number,
  dy: number,
  referenceLat: number
): { dLat: number; dLng: number } {
  const dLat = dy / METERS_PER_DEGREE_LAT;
  const dLng = dx / (METERS_PER_DEGREE_LAT * Math.cos((referenceLat * Math.PI) / 180));
  return { dLat, dLng };
}

/**
 * Reconstructs the four corner coordinates of a solar panel.
 *
 * `azimuthDegrees` is a compass bearing (0 = north, 90 = east, clockwise)
 * describing which way the roof segment — and therefore the panel — faces.
 * We treat that bearing as the rotation of the panel's "up" edge.
 *
 * Returns corners in order: top-left, top-right, bottom-right, bottom-left
 * (as seen looking down at the panel with "up" pointing toward azimuth 0
 * before rotation is applied), each as [lat, lng].
 */
export function computePanelCorners(
  center: LatLng,
  panelHeightMeters: number,
  panelWidthMeters: number,
  orientation: PanelOrientation,
  azimuthDegrees: number
): Array<[number, number]> {
  // LANDSCAPE swaps which physical dimension runs "up/down" vs "left/right".
  const height = orientation === "LANDSCAPE" ? panelWidthMeters : panelHeightMeters;
  const width = orientation === "LANDSCAPE" ? panelHeightMeters : panelWidthMeters;

  const halfH = height / 2;
  const halfW = width / 2;

  // Local frame before rotation: x = east, y = north.
  const localCorners: Array<[number, number]> = [
    [-halfW, halfH], // top-left
    [halfW, halfH], // top-right
    [halfW, -halfH], // bottom-right
    [-halfW, -halfH], // bottom-left
  ];

  const theta = (azimuthDegrees * Math.PI) / 180;
  const sin = Math.sin(theta);
  const cos = Math.cos(theta);

  return localCorners.map(([x, y]) => {
    // Standard bearing rotation: rotating a point by a clockwise compass
    // angle theta maps (x, y) -> (x*cos + y*sin, -x*sin + y*cos).
    const dx = x * cos + y * sin;
    const dy = -x * sin + y * cos;
    const { dLat, dLng } = metersToLatLngDelta(dx, dy, center.lat);
    return [center.lat + dLat, center.lng + dLng];
  });
}

/**
 * Projects a lat/lng to a pixel offset within a Static Maps image, given the
 * image's centre coordinate, zoom level and pixel dimensions. This is the
 * standard Web Mercator projection Google Maps uses internally, so it lines
 * up exactly with imagery fetched from the Maps Static API at the same
 * center/zoom.
 */
export function projectLatLngToPixel(
  point: LatLng,
  mapCenter: LatLng,
  zoom: number,
  imageWidth: number,
  imageHeight: number
): { x: number; y: number } {
  function worldCoordinate(latLng: LatLng): { x: number; y: number } {
    const siny = Math.min(Math.max(Math.sin((latLng.lat * Math.PI) / 180), -0.9999), 0.9999);
    const x = 128 + latLng.lng * (256 / 360);
    const y = 128 + 0.5 * Math.log((1 + siny) / (1 - siny)) * (-256 / (2 * Math.PI));
    return { x, y };
  }

  const scale = Math.pow(2, zoom);
  const centerWorld = worldCoordinate(mapCenter);
  const pointWorld = worldCoordinate(point);

  return {
    x: (pointWorld.x - centerWorld.x) * scale + imageWidth / 2,
    y: (pointWorld.y - centerWorld.y) * scale + imageHeight / 2,
  };
}

/**
 * Convenience wrapper: corners of a panel, already projected to pixel space
 * for a given Static Maps image. This is what the roof overlay renders.
 */
export function computePanelPixelPolygon(
  center: LatLng,
  panelHeightMeters: number,
  panelWidthMeters: number,
  orientation: PanelOrientation,
  azimuthDegrees: number,
  mapCenter: LatLng,
  zoom: number,
  imageWidth: number,
  imageHeight: number
): Array<[number, number]> {
  const corners = computePanelCorners(
    center,
    panelHeightMeters,
    panelWidthMeters,
    orientation,
    azimuthDegrees
  );
  return corners.map(([lat, lng]) => {
    const { x, y } = projectLatLngToPixel({ lat, lng }, mapCenter, zoom, imageWidth, imageHeight);
    return [x, y];
  });
}
