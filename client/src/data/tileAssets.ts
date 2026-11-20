// Tile 素材映射 — 双 Tileset 系统
//
// TMX 地图使用两个 tileset：
//   1. cleancity-organized (firstgid=1, 1200 tiles, 40列, 640×480)
//   2. cleancity-tilemap   (firstgid=1201, 1040 tiles, 40列, 640×416)
//
// 地图数据存储原始 GID，渲染时根据 GID 范围选择对应 tileset

import { Texture, Rectangle } from 'pixi.js'

export interface TilesetConfig {
  path: string
  firstgid: number
  tileCount: number
  columns: number
  tileWidth: number
  tileHeight: number
}

export const TILESETS: TilesetConfig[] = [
  {
    path: '/assets/tilesets/cleancity-organized.png',
    firstgid: 1,
    tileCount: 1200,
    columns: 40,
    tileWidth: 16,
    tileHeight: 16,
  },
  {
    path: '/assets/tilesets/cleancity-tilemap.png',
    firstgid: 1201,
    tileCount: 1040,
    columns: 40,
    tileWidth: 16,
    tileHeight: 16,
  },
]

// Flip flag masks (Tiled format)
const FLIP_H = 0x80000000
const FLIP_V = 0x40000000
const FLIP_D = 0x20000000
const GID_MASK = 0x1FFFFFFF

/** Strip flip flags from a raw GID */
export function stripFlipFlags(gid: number): number {
  return gid & GID_MASK
}

/** Find which tileset a GID belongs to, return config + local index */
export function resolveGID(gid: number): { config: TilesetConfig; localIndex: number } | null {
  const realGid = stripFlipFlags(gid)
  if (realGid === 0) return null

  // Find tileset (search backwards for highest firstgid match)
  for (let i = TILESETS.length - 1; i >= 0; i--) {
    if (realGid >= TILESETS[i].firstgid) {
      const localIndex = realGid - TILESETS[i].firstgid
      if (localIndex >= 0 && localIndex < TILESETS[i].tileCount) {
        return { config: TILESETS[i], localIndex }
      }
    }
  }
  return null
}

/**
 * Slice all needed tiles from multiple tileset textures.
 * @param textures Map of tileset path → loaded Texture
 * @param usedGIDs Set of raw GIDs used in the map (0 excluded)
 * @returns Map of raw GID → Texture frame
 */
export function sliceAllTilesets(
  textures: Map<string, Texture>,
  usedGIDs: Set<number>
): Map<number, Texture> {
  const result = new Map<number, Texture>()

  for (const gid of usedGIDs) {
    if (gid === 0) continue
    if (result.has(gid)) continue

    const resolved = resolveGID(gid)
    if (!resolved) continue

    const { config, localIndex } = resolved
    const tex = textures.get(config.path)
    if (!tex) {
      console.warn(`[tileAssets] Texture not found for ${config.path}`)
      continue
    }

    const source = tex.source
    const col = localIndex % config.columns
    const row = Math.floor(localIndex / config.columns)
    const frame = new Texture({
      source,
      frame: new Rectangle(
        col * config.tileWidth,
        row * config.tileHeight,
        config.tileWidth,
        config.tileHeight
      ),
    })
    result.set(gid, frame)
  }

  return result
}

/**
 * Collect all unique GIDs used across map layers.
 */
export function collectUsedGIDs(...layers: number[][][]): Set<number> {
  const used = new Set<number>()
  for (const layer of layers) {
    for (const row of layer) {
      for (const gid of row) {
        if (gid !== 0) used.add(gid)
      }
    }
  }
  return used
}

// Legacy exports (kept for backward compat, will be removed later)
export const CLEANCITY_TILESET = TILESETS[0]
export function getTileIndex(_tileType: number, _dirBitmask: number): number { return 0 }
export function sliceMapTiles(_baseTexture: Texture): Map<number, Texture> { return new Map() }
