// Tile 类型定义
export enum TileType {
  GRASS = 0,
  TALL_GRASS = 1,
  ROAD = 2,
  WATER = 3,
  SAND = 4,
  FLOWER = 5,
  TREE = 6,
  WALL = 7,
  ROOF = 8,
  DOOR = 9,
  WINDOW = 10,
  FENCE = 11,
  BRIDGE = 12,
  STONE = 13,
  PATH = 14,
  DIRT = 15,
}

// 不可通行的 tile
export const BLOCKED_TILES = new Set([
  TileType.WATER,
  TileType.TREE,
  TileType.WALL,
  TileType.ROOF,
  TileType.WINDOW,
  TileType.FENCE,
  TileType.STONE,
])

export interface TilesetData {
  tileWidth: number
  tileHeight: number
  columns: number
}

export interface SpriteFrame {
  x: number
  y: number
  width: number
  height: number
}

export interface CharacterSpriteData {
  tileWidth: number
  tileHeight: number
  characters: number
  directions: number
  frames: number
  directionMap: Record<string, number>
}

export type Direction = 'down' | 'left' | 'right' | 'up'

export interface GameEntity {
  x: number       // tile 坐标
  y: number
  sprite: any     // PIXI.AnimatedSprite
  direction: Direction
  isMoving: boolean
}

export interface ScheduleEntry {
  time: number      // 游戏时间（分钟，600 = 6:00）
  tileX: number
  tileY: number
  activity?: string // 可选：当前活动描述
}

export interface NPCData {
  id: string
  name: string
  spriteIndex: number   // 角色精灵表中的索引
  occupation?: string
  age?: number
  personality?: string[]
  description?: string
  schedule: ScheduleEntry[]
}
