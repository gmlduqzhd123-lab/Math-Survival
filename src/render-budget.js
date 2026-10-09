// Keep the large CSS playfield without multiplying frame-buffer pixels by DPR².
export const MAX_RENDER_PIXELS = 3_000_000;
export function renderDpr(width, height, deviceDpr = 1) {
  return Math.min(3, deviceDpr || 1, Math.sqrt(MAX_RENDER_PIXELS / Math.max(1, width * height)));
}
