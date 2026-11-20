import { Texture, Rectangle } from 'pixi.js'

// human-01.png 统一角色精灵表
// 96×128, 3列×4行, 每帧32×32
// 行: 0=down, 1=up, 2=right, 3=left
// 每行3帧: [walk1, idle, walk2]
const TILE = 32
const COLS = 3
const ROWS = 4
const DIR_ROW: Record<string, number> = {
  down: 0,
  up: 1,
  right: 2,
  left: 3,
}

/**
 * 切片 human-01.png
 * 返回 Map: "direction" → [walk1, idle, walk2]
 *
 * 布局：down/up 中间帧=idle，left/right 最左帧=idle
 */
export function sliceHumanSprite(baseTexture: Texture): Map<string, Texture[]> {
  const frames = new Map<string, Texture[]>()
  const src = baseTexture.source

  // down(row0) / up(row1)：idle=中间帧(col1)
  for (const dirName of ['down', 'up']) {
    const row = DIR_ROW[dirName]
    const dirTextures: Texture[] = []
    for (let col = 0; col < COLS; col++) {
      dirTextures.push(new Texture({
        source: src,
        frame: new Rectangle(col * TILE, row * TILE, TILE, TILE),
      }))
    }
    // 返回 [walk1, idle, walk2] — idle 是 col1
    frames.set(dirName, [dirTextures[0], dirTextures[1], dirTextures[2]])
  }

  // right(row2) / left(row3)：idle=最左帧(col0)
  for (const dirName of ['right', 'left']) {
    const row = DIR_ROW[dirName]
    const dirTextures: Texture[] = []
    for (let col = 0; col < COLS; col++) {
      dirTextures.push(new Texture({
        source: src,
        frame: new Rectangle(col * TILE, row * TILE, TILE, TILE),
      }))
    }
    // 返回 [walk1, idle, walk2] — idle 是 col0，走路是 col1+col2
    frames.set(dirName, [dirTextures[1], dirTextures[0], dirTextures[2]])
  }

  return frames
}

/**
 * 获取某方向的帧 [walk1, idle, walk2]
 */
export function getHumanFrames(
  allFrames: Map<string, Texture[]>,
  direction: string
): Texture[] {
  return allFrames.get(direction) ?? []
}
