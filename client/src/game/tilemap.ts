// tilemap.ts — Facade: re-exports from map-data.ts + shared constants
// Other files (Player, NPC, Camera) import from here unchanged.

export { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE, GROUND_DATA, OBJECT_DATA, OVERLAY_DATA, COLLISION_DATA, isWalkable } from './map-data'

// 整数缩放倍数（16px 逻辑 → 48px 屏幕，像素清晰）
export const SCALE = 3
