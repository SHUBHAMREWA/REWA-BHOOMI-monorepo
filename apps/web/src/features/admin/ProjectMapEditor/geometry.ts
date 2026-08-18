import type { LocalCoord, LocalPolygon } from './types';

/** Safely normalizes bad DB polygon geometries (2D array to 3D array & legacy pixel coords) */
export function normalizeGeometry(geom: any): LocalPolygon | undefined {
  if (!geom || geom.type !== 'Polygon' || !geom.coordinates || geom.coordinates.length === 0) return undefined;
  
  let coords = geom.coordinates;
  if (typeof coords[0][0] === 'number') {
    coords = [coords];
  }

  const normalizedRings = coords.map((ring: any[]) => {
    return ring.map((pt: any) => {
      let x = Number(pt[0]) || 0;
      let y = Number(pt[1]) || 0;
      if (x > 1.5) x = x / 2000;
      if (y > 1.5) y = y / 1500;
      return [x, y];
    });
  });

  return { type: 'Polygon', coordinates: normalizedRings };
}

/** Convert normalized [0,1] coords to canvas pixel coords */
export function toCanvas(coord: LocalCoord, width: number, height: number): [number, number] {
  return [coord[0] * width, coord[1] * height];
}

/** Convert canvas pixel coords back to normalized [0,1] */
export function toNormalized(x: number, y: number, width: number, height: number): LocalCoord {
  return [x / width, y / height];
}

/** Flatten polygon points for Konva Line */
export function polygonToKonvaPoints(
  coords: LocalCoord[],
  width: number,
  height: number,
): number[] {
  return coords.flatMap(([x, y]) => [x * width, y * height]);
}

/** Compute bounding box center of a polygon */
export function polygonCenter(coords: LocalCoord[]): LocalCoord {
  if (coords.length === 0) return [0.5, 0.5];
  const xs = coords.map((c) => c[0]);
  const ys = coords.map((c) => c[1]);
  return [
    (Math.min(...xs) + Math.max(...xs)) / 2,
    (Math.min(...ys) + Math.max(...ys)) / 2,
  ];
}

/** Check if a point is inside a polygon using ray casting */
export function pointInPolygon(point: LocalCoord, polygon: LocalCoord[]): boolean {
  const [px, py] = point;
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i];
    const [xj, yj] = polygon[j];
    const intersect =
      yi > py !== yj > py && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }
  return inside;
}

/** Generate a unique temp ID */
export function genTempId(): string {
  return `tmp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

/** Snap coordinate to grid (optional quality of life) */
export function snapToGrid(coord: LocalCoord, gridSize = 0.01): LocalCoord {
  return [
    Math.round(coord[0] / gridSize) * gridSize,
    Math.round(coord[1] / gridSize) * gridSize,
  ];
}
