import { AnimatedSprite, Texture, Text, Container } from 'pixi.js'
import PF from 'pathfinding'
import { TILE_SIZE, MAP_WIDTH, MAP_HEIGHT, isWalkable } from './tilemap'
import type { Direction, ScheduleEntry, NPCData } from './types'

const SPEED = 1.5 // NPC 移动速度（tiles per second）

// 全局共享的寻路资源（所有 NPC 复用）
const sharedFinder = new PF.AStarFinder({
  allowDiagonal: false,
  dontCrossCorners: true,
  heuristic: PF.Heuristic.manhattan,
})

// 缓存 walkable grid（地图不变时只需构建一次）
let cachedWalkableGrid: PF.Grid | null = null
function getWalkableGrid(): PF.Grid {
  if (!cachedWalkableGrid) {
    cachedWalkableGrid = new PF.Grid(MAP_WIDTH, MAP_HEIGHT)
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        if (!isWalkable(x, y)) {
          cachedWalkableGrid.setWalkableAt(x, y, false)
        }
      }
    }
  }
  return cachedWalkableGrid
}

export class NPC {
  id: string
  name: string
  sprite: AnimatedSprite
  nameLabel: Text
  container: Container
  tileX: number
  tileY: number
  direction: Direction = 'down'
  isMoving = false
  currentActivity = ''

  private schedule: ScheduleEntry[]
  private spriteIndex: number
  private dirIdleFrames: Record<string, Texture> = {}   // 每方向的idle帧(中间帧)
  private dirWalkFrames: Record<string, Texture[]> = {} // 每方向的walk帧[walk1, walk2]

  // 寻路
  private path: { x: number; y: number }[] = []
  private pathIndex = 0
  private targetPixelX: number
  private targetPixelY: number
  private lastTargetTileX = -1
  private lastTargetTileY = -1

  // 踱步系统（周期：静止IDLE_TIME秒 → 走1步 → 回到静止）
  private paceTimer = 0
  private pacing = false
  private homeTileX = -1
  private homeTileY = -1
  private readonly PACE_RANGE = 3
  private readonly IDLE_BASE = 7    // 基础静止时长（秒）
  private readonly IDLE_EXTRA = 5   // 随机额外静止（0~5秒）
  private idleThreshold = 0         // 本次idle的阈值（计算一次）

  // 点击回调
  onClick: ((npcId: string) => void) | null = null

  constructor(data: NPCData, getFrames: (spriteIndex: number, direction: string) => Texture[]) {
    this.id = data.id
    this.name = data.name
    this.schedule = data.schedule.sort((a, b) => a.time - b.time)
    this.spriteIndex = data.spriteIndex
    // 随机初始偏移，避免所有NPC同时开始踱步
    this.paceTimer = Math.random() * this.IDLE_BASE
    this.idleThreshold = this.IDLE_BASE + Math.random() * this.IDLE_EXTRA

    const firstEntry = this.schedule[0]
    this.tileX = firstEntry?.tileX ?? 10
    this.tileY = firstEntry?.tileY ?? 10
    this.targetPixelX = this.tileX * TILE_SIZE
    this.targetPixelY = this.tileY * TILE_SIZE + TILE_SIZE // 脚底对齐 tile 底部

    // 分离 idle 帧(中间)和 walk 帧(两边)
    for (const dir of ['down', 'left', 'right', 'up']) {
      const allFrames = getFrames(data.spriteIndex, dir) // [walk1, idle, walk2]
      this.dirWalkFrames[dir] = [allFrames[0], allFrames[2]]  // 两帧走路动画
      this.dirIdleFrames[dir] = allFrames[1]                   // 中间idle帧
    }

    // container 定位在 NPC 世界坐标（脚底位置）
    this.container = new Container()
    this.container.x = this.targetPixelX
    this.container.y = this.targetPixelY

    // sprite 在 container 内相对定位，锚点在底部
    this.sprite = new AnimatedSprite(this.dirWalkFrames.down)
    this.sprite.anchor.set(0, 1) // 锚点在底部（脚底）
    this.sprite.x = 0
    this.sprite.y = 0
    this.sprite.animationSpeed = 0.1
    this.sprite.loop = true
    // 初始显示idle帧
    this.sprite.textures = [this.dirIdleFrames.down]
    this.sprite.gotoAndStop(0)

    // nameLabel 在 sprite 头顶上方
    this.nameLabel = new Text({
      text: this.name,
      style: {
        fontFamily: 'Noto Sans SC, system-ui',
        fontSize: 10,
        fill: 0xf0e6d3,
        align: 'center',
      },
      resolution: 3,  // 3x分辨率，配合SCALE=3保持清晰
    })
    this.nameLabel.anchor.set(0.5, 1) // 底部居中
    this.nameLabel.x = TILE_SIZE / 2
    this.nameLabel.y = -TILE_SIZE * 2 - 2 // 32px sprite 上方 2px

    this.container.addChild(this.sprite)
    // 名字标签已移除（SCALE=3下模糊，等有不同立绘后用外观区分）

    this.container.eventMode = 'static'
    this.container.cursor = 'pointer'
    this.container.hitArea = {
      contains: (x: number, y: number) =>
        x >= -4 && x < TILE_SIZE + 4 && y >= -TILE_SIZE * 2 - 4 && y < 4,
    }
    this.container.on('pointertap', () => {
      this.onClick?.(this.id)
    })
  }

  update(gameTimeMinutes: number, dt: number) {
    const target = this.getCurrentTarget(gameTimeMinutes)
    if (!target) return

    // 目标变了 → 重新寻路，重置踱步
    if (target.tileX !== this.lastTargetTileX || target.tileY !== this.lastTargetTileY) {
      this.pacing = false
      this.paceTimer = 0
      this.homeTileX = target.tileX
      this.homeTileY = target.tileY
      if (target.tileX !== this.tileX || target.tileY !== this.tileY) {
        // 距离太远时直接传送（屏幕外 NPC 优化）
        const dist = Math.abs(target.tileX - this.tileX) + Math.abs(target.tileY - this.tileY)
        if (dist > 20) {
          this.teleportTo(target.tileX, target.tileY)
        } else {
          this.findPathTo(target.tileX, target.tileY)
        }
      }
      this.lastTargetTileX = target.tileX
      this.lastTargetTileY = target.tileY
    }

    this.currentActivity = target.activity || ''

    // 踱步逻辑：路径走完且目标未变时，随机踱步
    if (this.pathIndex >= this.path.length && !this.pacing) {
      this.updatePacing(dt)
    }

    this.moveAlongPath(dt)
  }

  private getCurrentTarget(gameTimeMinutes: number): ScheduleEntry | null {
    for (let i = this.schedule.length - 1; i >= 0; i--) {
      if (this.schedule[i].time <= gameTimeMinutes) {
        return this.schedule[i]
      }
    }
    return this.schedule[0] ?? null
  }

  /** 初始化时根据当前游戏时间直接跳到正确位置 */
  initToCurrentTime(gameTimeMinutes: number) {
    const target = this.getCurrentTarget(gameTimeMinutes)
    if (target) {
      this.teleportTo(target.tileX, target.tileY)
      this.homeTileX = target.tileX
      this.homeTileY = target.tileY
      this.lastTargetTileX = target.tileX
      this.lastTargetTileY = target.tileY
      this.currentActivity = target.activity || ''
      // 显示idle帧
      this.direction = 'down'
      this.sprite.textures = [this.dirIdleFrames['down']]
      this.sprite.gotoAndStop(0)
    }
  }

  /** 直接传送到目标位置（屏幕外 NPC 优化） */
  private teleportTo(tileX: number, tileY: number) {
    this.tileX = tileX
    this.tileY = tileY
    this.container.x = tileX * TILE_SIZE
    this.container.y = tileY * TILE_SIZE + TILE_SIZE // 脚底对齐
    this.targetPixelX = this.container.x
    this.targetPixelY = this.container.y
    this.path = []
    this.pathIndex = 0
  }

  private findPathTo(targetX: number, targetY: number) {
    // 从缓存的 walkable grid clone（clone 比重建快很多）
    const grid = getWalkableGrid().clone()

    const rawPath = sharedFinder.findPath(
      this.tileX, this.tileY,
      targetX, targetY,
      grid
    )

    if (rawPath.length > 0) {
      this.path = rawPath.map(([x, y]) => ({ x, y }))
      this.pathIndex = 0
    } else {
      // 寻路失败时清除路径，下次 update 重试
      this.path = []
      this.pathIndex = 0
    }
  }

  private moveAlongPath(dt: number) {
    if (this.pathIndex >= this.path.length) {
      if (this.pacing) {
        // 踱步的一步走完 → 回到静止
        this.pacing = false
        this.paceTimer = 0
        this.homeTileX = this.tileX
        this.homeTileY = this.tileY
      }
      this.isMoving = false
      this.sprite.stop()
      // 静止时显示正面idle帧
      this.direction = 'down'
      this.sprite.textures = [this.dirIdleFrames['down']]
      this.sprite.gotoAndStop(0)
      return
    }

    const nextTile = this.path[this.pathIndex]
    const targetPx = nextTile.x * TILE_SIZE
    const targetPy = nextTile.y * TILE_SIZE + TILE_SIZE // 脚底对齐

    const dx = targetPx - this.container.x
    const dy = targetPy - this.container.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist < 0.5) {
      this.container.x = targetPx
      this.container.y = targetPy
      this.tileX = nextTile.x
      this.tileY = nextTile.y
      this.pathIndex++
      return
    }

    const step = SPEED * TILE_SIZE * dt
    const moveStep = Math.min(step, dist)
    this.container.x += (dx / dist) * moveStep
    this.container.y += (dy / dist) * moveStep

    this.isMoving = true
    if (Math.abs(dx) > Math.abs(dy)) {
      this.direction = dx > 0 ? 'right' : 'left'
    } else {
      this.direction = dy > 0 ? 'down' : 'up'
    }
    this.sprite.textures = this.dirWalkFrames[this.direction]
    this.sprite.play()
  }

  destroy() {
    this.container.removeAllListeners()
  }

  /** 闲暇时随机踱步（走1步就停） */
  private updatePacing(dt: number) {
    if (this.homeTileX < 0) {
      this.homeTileX = this.tileX
      this.homeTileY = this.tileY
    }

    this.paceTimer += dt

    // 阈值在进入idle时计算一次，避免每帧重算
    if (this.idleThreshold === 0) {
      this.idleThreshold = this.IDLE_BASE + Math.random() * this.IDLE_EXTRA
    }
    if (this.paceTimer < this.idleThreshold) return

    // 走一步
    this.pacing = true
    this.idleThreshold = 0  // 重置，下次idle时重新计算
    this.paceOneStep()
  }

  /** 踱步走一步（随机方向，不超出 PACE_RANGE） */
  private paceOneStep() {
    const directions = [
      { dx: 1, dy: 0, dir: 'right' as Direction },
      { dx: -1, dy: 0, dir: 'left' as Direction },
      { dx: 0, dy: 1, dir: 'down' as Direction },
      { dx: 0, dy: -1, dir: 'up' as Direction },
    ]

    // 随机打乱方向
    for (let i = directions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [directions[i], directions[j]] = [directions[j], directions[i]]
    }

    for (const d of directions) {
      const nx = this.tileX + d.dx
      const ny = this.tileY + d.dy
      const distFromHome = Math.abs(nx - this.homeTileX) + Math.abs(ny - this.homeTileY)
      if (distFromHome <= this.PACE_RANGE && isWalkable(nx, ny)) {
        this.direction = d.dir
        this.sprite.textures = this.dirWalkFrames[d.dir]
        this.sprite.play()
        this.path = [{ x: nx, y: ny }]
        this.pathIndex = 0
        return
      }
    }

    // 四周走不了，回到静止
    this.pacing = false
    this.paceTimer = 0
  }
}
