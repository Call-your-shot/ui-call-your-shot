// Shared between the image proxy route and the panel-polygon projection in
// normalize.ts — they must always agree, or overlaid panels will drift off
// the roof they're meant to sit on.
export const STATIC_MAP_ZOOM = 20;
export const STATIC_MAP_SIZE = 640;
