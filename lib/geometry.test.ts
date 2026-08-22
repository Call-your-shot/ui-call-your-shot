import { describe, expect, it } from "vitest";
import {
  computePanelCorners,
  computePanelPixelPolygon,
  metersToLatLngDelta,
  projectLatLngToPixel,
  type LatLng,
} from "./geometry";

describe("metersToLatLngDelta", () => {
  it("converts a 111.32km northward offset to ~1 degree of latitude", () => {
    const { dLat } = metersToLatLngDelta(0, 111_320, 0);
    expect(dLat).toBeCloseTo(1, 5);
  });

  it("converts a 111.32km eastward offset at the equator to ~1 degree of longitude", () => {
    const { dLng } = metersToLatLngDelta(111_320, 0, 0);
    expect(dLng).toBeCloseTo(1, 5);
  });

  it("shrinks longitude degrees away from the equator", () => {
    const atEquator = metersToLatLngDelta(1000, 0, 0);
    const atForty = metersToLatLngDelta(1000, 0, 40);
    // The same eastward metre offset spans MORE degrees of longitude as you
    // move away from the equator, since a degree of longitude covers less
    // ground there.
    expect(atForty.dLng).toBeGreaterThan(atEquator.dLng);
  });

  it("has zero offset for zero distance", () => {
    const { dLat, dLng } = metersToLatLngDelta(0, 0, -34.4);
    expect(dLat).toBe(0);
    expect(dLng).toBe(0);
  });
});

describe("computePanelCorners", () => {
  const center: LatLng = { lat: -34.4, lng: 150.9 };

  it("produces 4 corners", () => {
    const corners = computePanelCorners(center, 1.7, 1.0, "PORTRAIT", 0);
    expect(corners).toHaveLength(4);
  });

  it("centers the corners around the panel centre (mean ≈ center)", () => {
    const corners = computePanelCorners(center, 1.7, 1.0, "PORTRAIT", 37);
    const meanLat = corners.reduce((s, [lat]) => s + lat, 0) / corners.length;
    const meanLng = corners.reduce((s, [, lng]) => s + lng, 0) / corners.length;
    expect(meanLat).toBeCloseTo(center.lat, 6);
    expect(meanLng).toBeCloseTo(center.lng, 6);
  });

  it("at azimuth 0, the top corners sit north of the bottom corners", () => {
    const [topLeft, topRight, bottomRight, bottomLeft] = computePanelCorners(
      center,
      2,
      1,
      "PORTRAIT",
      0
    );
    expect(topLeft[0]).toBeGreaterThan(bottomLeft[0]);
    expect(topRight[0]).toBeGreaterThan(bottomRight[0]);
  });

  it("at azimuth 0, the left corners sit west of the right corners", () => {
    const [topLeft, topRight] = computePanelCorners(center, 2, 1, "PORTRAIT", 0);
    expect(topLeft[1]).toBeLessThan(topRight[1]);
  });

  it("rotates 90° so the 'north' edge becomes the 'east' edge", () => {
    const unrotated = computePanelCorners(center, 2, 1, "PORTRAIT", 0);
    const rotated = computePanelCorners(center, 2, 1, "PORTRAIT", 90);

    // Latitude and longitude degrees aren't the same physical distance away
    // from the equator, so convert both back to metres (undoing each
    // conversion's own scale factor) before comparing magnitudes.
    const metersPerDegreeLat = 111_320;
    const metersPerDegreeLng = 111_320 * Math.cos((center.lat * Math.PI) / 180);

    // The unrotated top-left corner is offset (west, north) of centre.
    // After a 90° clockwise rotation that same physical corner should now
    // be offset (north, east) — i.e. its north-offset becomes an east
    // offset, and its west-offset becomes a north offset.
    const unrotatedNorthMeters = (unrotated[0][0] - center.lat) * metersPerDegreeLat;
    const unrotatedWestMeters = (center.lng - unrotated[0][1]) * metersPerDegreeLng;

    const rotatedNorthMeters = (rotated[0][0] - center.lat) * metersPerDegreeLat;
    const rotatedEastMeters = (rotated[0][1] - center.lng) * metersPerDegreeLng;

    expect(rotatedEastMeters).toBeCloseTo(unrotatedNorthMeters, 6);
    expect(rotatedNorthMeters).toBeCloseTo(unrotatedWestMeters, 6);
  });

  it("swaps height/width for LANDSCAPE vs PORTRAIT", () => {
    const portrait = computePanelCorners(center, 1.7, 1.0, "PORTRAIT", 0);
    const landscape = computePanelCorners(center, 1.7, 1.0, "LANDSCAPE", 0);

    const spanLat = (corners: Array<[number, number]>) =>
      Math.max(...corners.map((c) => c[0])) - Math.min(...corners.map((c) => c[0]));
    const spanLng = (corners: Array<[number, number]>) =>
      Math.max(...corners.map((c) => c[1])) - Math.min(...corners.map((c) => c[1]));

    // Portrait: taller (bigger lat span) than wide. Landscape: the opposite.
    expect(spanLat(portrait)).toBeGreaterThan(spanLng(portrait));
    expect(spanLng(landscape)).toBeGreaterThan(spanLat(landscape));
  });
});

describe("projectLatLngToPixel", () => {
  const center: LatLng = { lat: -34.4, lng: 150.9 };

  it("projects the map centre to the exact image centre", () => {
    const { x, y } = projectLatLngToPixel(center, center, 20, 640, 640);
    expect(x).toBeCloseTo(320, 6);
    expect(y).toBeCloseTo(320, 6);
  });

  it("places a point north of centre above it (smaller y) in image space", () => {
    const north = { lat: center.lat + 0.001, lng: center.lng };
    const { y } = projectLatLngToPixel(north, center, 20, 640, 640);
    expect(y).toBeLessThan(320);
  });

  it("places a point east of centre to its right (larger x) in image space", () => {
    const east = { lat: center.lat, lng: center.lng + 0.001 };
    const { x } = projectLatLngToPixel(east, center, 20, 640, 640);
    expect(x).toBeGreaterThan(320);
  });

  it("moves points further from centre at higher zoom levels", () => {
    const north = { lat: center.lat + 0.0005, lng: center.lng };
    const low = projectLatLngToPixel(north, center, 18, 640, 640);
    const high = projectLatLngToPixel(north, center, 20, 640, 640);
    expect(Math.abs(320 - high.y)).toBeGreaterThan(Math.abs(320 - low.y));
  });
});

describe("computePanelPixelPolygon", () => {
  it("returns 4 pixel points, roughly centred on the panel's own map position", () => {
    const mapCenter: LatLng = { lat: -34.4, lng: 150.9 };
    const panelCenter: LatLng = { lat: -34.4, lng: 150.9 };
    const polygon = computePanelPixelPolygon(
      panelCenter,
      1.7,
      1.0,
      "PORTRAIT",
      0,
      mapCenter,
      20,
      640,
      640
    );
    expect(polygon).toHaveLength(4);
    const meanX = polygon.reduce((s, [x]) => s + x, 0) / 4;
    const meanY = polygon.reduce((s, [, y]) => s + y, 0) / 4;
    // Panel sits at the map centre, so its pixel centroid should too.
    expect(meanX).toBeCloseTo(320, 0);
    expect(meanY).toBeCloseTo(320, 0);
  });
});
