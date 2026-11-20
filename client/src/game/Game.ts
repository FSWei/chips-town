import { Application, Container, Assets, Sprite, Texture } from 'pixi.js'
import { Player } from './Player'
import { NPC } from './NPC'
import { Camera } from './Camera'
import { sliceHumanSprite, getHumanFrames } from './humanSprite'
import { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE, SCALE } from './tilemap'
import { GROUND_DATA, OBJECT_DATA, OVERLAY_DATA, isWalkable } from './map-data'
import { TILESETS, sliceAllTilesets, collectUsedGIDs } from '../data/tileAssets'
import { getNpcScheduleData } from '../data/npcLoader'
const NPC_SCHEDULES = getNpcScheduleData()

// 游戏时间与现实时间同步：直接用 new Date() 读系统时钟
// 按 T 键可循环切换时间倍速：1x → 60x → 360x → 1440x → 1x

/** 一组相连的 object tile，构成一栋建筑/结构 */
interface BuildingGroup {
  tiles: { x: number; y: number }[]
  sprites: Sprite[]
  /** 轴对齐包围盒，用于快速碰撞检测 */
  bounds: { minX: number; minY: number; maxX: number; maxY: number }
}

export class Game {
  app: Application | null = null
  private world = new Container()
  private groundLayer = new Container()   // 最底层：草地/路面（不排序）
  /** 下层overlay：地面装饰（在角色下方） */
  private overlayBelowLayer = new Container()
  /** 中间层：建筑+角色统一按 y 排序（低处遮挡高处） */
  private objectLayer = new Container()
  /** 上层overlay：树冠/楼顶（在角色上方） */
  private overlayAboveLayer = new Container()

  private player: Player | null = null
  private npcs: NPC[] = []
  private camera: Camera | null = null

  private gameTimeMinutes = 0 // 真实时间分钟数（含秒的小数部分）
  private timeMultiplier = 1 // 1=真实时间，按 T 键循环
  private _accelBaseRealSec = 0 // 加速模式起始的现实秒数
  private _accelBaseGameMin = 0 // 加速模式起始的游戏分钟
  private tilesetFrames: Map<number, Texture> = new Map()
  private humanFrames: Map<string, Texture[]> = new Map()  // human-01.png 统一角色帧

  // 建筑透明度系统
  private buildings: BuildingGroup[] = []
  private activeBuilding: BuildingGroup | null = null

  // 保存引用用于清理
  private onResize: (() => void) | null = null
  private updateBound: ((ticker: any) => void) | null = null
  private onKeyDown: ((e: KeyboardEvent) => void) | null = null

  onNpcClick: ((npcId: string, activity: string) => void) | null = null
  onTimeUpdate: ((timeStr: string) => void) | null = null
  onTimeMultiplierChange: ((mult: number) => void) | null = null
  onGameTimeUpdate: ((minutes: number) => void) | null = null

  /** 自动创建 canvas 并挂载到指定容器 */
  async initWithContainer(container: HTMLElement) {
    const canvas = document.createElement('canvas')
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
    container.appendChild(canvas)
    await this._initCore(canvas)
    // PixiJS v8 会把 canvas 从 DOM 移除，需要重新挂回去
    const actualCanvas = this.app?.canvas as HTMLCanvasElement
    if (actualCanvas && !actualCanvas.isConnected) {
      container.appendChild(actualCanvas)
    }
  }

  private async _initCore(canvas: HTMLCanvasElement) {
    try {
      this.app = new Application()
      await this.app.init({
        canvas: canvas,
        width: window.innerWidth,
        height: window.innerHeight,
        backgroundColor: 0x1a1a2e,
        antialias: false,
        resolution: 1,
      })


      this.world.scale.set(SCALE)

      await this.loadAssets()

      this.buildMap()
      this.createPlayer()
      this.createNPCs()

      // 层级顺序：ground → overlayBelow → object(建筑+角色) → overlayAbove(树冠/楼顶)
      this.objectLayer.sortableChildren = true
      this.world.addChild(this.groundLayer)
      this.world.addChild(this.overlayBelowLayer)
      this.world.addChild(this.objectLayer)
      this.world.addChild(this.overlayAboveLayer)
      this.app.stage.addChild(this.world)

      this.camera = new Camera(this.world, this.app, SCALE)
      if (this.player) {
        this.camera.snapTo(this.player.worldX, this.player.worldY)
      }

      // 主循环（保存引用用于清理）
      this.updateBound = this.update.bind(this)
      this.app.ticker.add(this.updateBound)

      // 窗口大小变化
      this.onResize = () => {
        this.app?.renderer.resize(window.innerWidth, window.innerHeight)
        this.camera?.updateScreenSize(window.innerWidth, window.innerHeight)
      }
      window.addEventListener('resize', this.onResize)

      // 时间加速快捷键（T 键循环切换）
      this.onKeyDown = (e: KeyboardEvent) => {
        if (e.key === 't' || e.key === 'T') {
          this._accelBaseRealSec = 0 // 重置加速基准
          if (this.timeMultiplier === 1) this.timeMultiplier = 60
          else if (this.timeMultiplier === 60) this.timeMultiplier = 360
          else if (this.timeMultiplier === 360) this.timeMultiplier = 1440
          else this.timeMultiplier = 1
          this.onTimeMultiplierChange?.(this.timeMultiplier)
        }
      }
      window.addEventListener('keydown', this.onKeyDown)

      // NPC 点击由 PixiJS pointertap 事件处理（见 NPC.ts constructor）

    } catch (err) {
      console.error('[Game] Init failed:', err)
      throw err
    }
  }

  private async loadAssets() {
    const humanTexture = await Assets.load('/assets/sprites/human-01.png')
    try {
      if (humanTexture?.source) humanTexture.source.scaleMode = 'nearest'
    } catch (e) { /* ok */ }
    this.humanFrames = sliceHumanSprite(humanTexture)

    // Load both tilesets
    const textureMap = new Map<string, Texture>()
    for (const ts of TILESETS) {
      const tex = await Assets.load(ts.path)
      try {
        if (tex?.source) tex.source.scaleMode = 'nearest'
      } catch (e) { /* ok */ }
      textureMap.set(ts.path, tex)
    }

    // Collect all used GIDs from map layers and slice only needed tiles
    const usedGIDs = collectUsedGIDs(GROUND_DATA, OBJECT_DATA, OVERLAY_DATA)
    this.tilesetFrames = sliceAllTilesets(textureMap, usedGIDs)
  }

  private buildMap() {
    let tileCount = 0
    // 临时存储 object 层精灵，用于建筑分组
    const objectSprites: (Sprite | null)[][] = []

    // Ground layer: grass, roads, water, floors (no z-sorting needed)
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const gid = GROUND_DATA[y][x]
        if (gid === 0) continue
        const frame = this.tilesetFrames.get(gid)
        if (!frame) continue
        const sprite = new Sprite(frame)
        sprite.x = x * TILE_SIZE
        sprite.y = y * TILE_SIZE
        this.groundLayer.addChild(sprite)
        tileCount++
      }
    }

    // Object layer: buildings, trees, fences
    for (let y = 0; y < MAP_HEIGHT; y++) {
      objectSprites[y] = []
      for (let x = 0; x < MAP_WIDTH; x++) {
        const gid = OBJECT_DATA[y][x]
        if (gid === 0) { objectSprites[y][x] = null; continue }
        const frame = this.tilesetFrames.get(gid)
        if (!frame) { objectSprites[y][x] = null; continue }
        const sprite = new Sprite(frame)
        sprite.x = x * TILE_SIZE
        sprite.y = y * TILE_SIZE
        sprite.zIndex = y * TILE_SIZE + TILE_SIZE  // 建筑zIndex+1，确保同tileY时建筑在NPC前面
        this.objectLayer.addChild(sprite)
        objectSprites[y][x] = sprite
        tileCount++
      }
    }

    // Overlay layer: split into below/above based on object tile below
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        const gid = OVERLAY_DATA[y][x]
        if (gid === 0) continue
        const frame = this.tilesetFrames.get(gid)
        if (!frame) continue
        const sprite = new Sprite(frame)
        sprite.x = x * TILE_SIZE
        sprite.y = y * TILE_SIZE
        // 下方有 object tile → 树冠/楼顶 → 渲染在角色上方
        // 同行有 object tile → 建筑底部装饰（门槛/台阶） → 也渲染在上方
        const hasObjectBelow = (y + 1 < MAP_HEIGHT) && OBJECT_DATA[y + 1][x] !== 0
        const hasObjectSame = OBJECT_DATA[y][x] !== 0
        if (hasObjectBelow || hasObjectSame) {
          this.overlayAboveLayer.addChild(sprite)
        } else {
          this.overlayBelowLayer.addChild(sprite)
        }
        tileCount++
      }
    }

    // 建筑分组：对 object 层做连通域分析
    this.buildings = this.detectBuildings(objectSprites)
  }

  /** BFS 连通域分析，将相邻的 object tile 分组为建筑 */
  private detectBuildings(objectSprites: (Sprite | null)[][]): BuildingGroup[] {
    const visited = Array.from({ length: MAP_HEIGHT }, () => Array(MAP_WIDTH).fill(false))
    const groups: BuildingGroup[] = []

    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        if (visited[y][x] || !objectSprites[y]?.[x]) continue

        // BFS 找出所有相连的 object tiles
        const tiles: { x: number; y: number }[] = []
        const sprites: Sprite[] = []
        const queue: [number, number][] = [[x, y]]
        visited[y][x] = true

        let minX = x, minY = y, maxX = x, maxY = y

        while (queue.length > 0) {
          const [cx, cy] = queue.shift()!
          tiles.push({ x: cx, y: cy })
          const spr = objectSprites[cy][cx]
          if (spr) sprites.push(spr)

          if (cx < minX) minX = cx
          if (cy < minY) minY = cy
          if (cx > maxX) maxX = cx
          if (cy > maxY) maxY = cy

          // 4方向扩展
          for (const [dx, dy] of [[0, -1], [1, 0], [0, 1], [-1, 0]]) {
            const nx = cx + dx
            const ny = cy + dy
            if (nx >= 0 && nx < MAP_WIDTH && ny >= 0 && ny < MAP_HEIGHT
                && !visited[ny][nx] && objectSprites[ny]?.[nx]) {
              visited[ny][nx] = true
              queue.push([nx, ny])
            }
          }
        }

        groups.push({
          tiles,
          sprites,
          bounds: { minX, minY, maxX, maxY },
        })
      }
    }
    return groups
  }

  /** 检测玩家是否在某栋建筑内，调整透明度 */
  private updateBuildingTransparency() {
    if (!this.player) return

    const px = this.player.tileX
    const py = this.player.tileY

    // 找到玩家所在的建筑
    let newActive: BuildingGroup | null = null
    for (const building of this.buildings) {
      const { minX, minY, maxX, maxY } = building.bounds
      // 精确检测：玩家脚底是否在建筑的某个 tile 上
      if (px >= minX && px <= maxX && py >= minY && py <= maxY) {
        // 再检查是否真的踩在建筑 tile 上（而非建筑包围盒的空隙）
        if (building.tiles.some(t => t.x === px && t.y === py)) {
          newActive = building
          break
        }
      }
    }

    // 建筑变了 → 更新透明度
    if (newActive !== this.activeBuilding) {
      // 恢复旧建筑
      if (this.activeBuilding) {
        for (const spr of this.activeBuilding.sprites) {
          spr.alpha = 1.0
        }
      }
      // 半透明新建筑
      if (newActive) {
        for (const spr of newActive.sprites) {
          spr.alpha = 0.35
        }
      }
      this.activeBuilding = newActive
    }
  }

  private createPlayer() {
    this.player = new Player(10, 10, this.humanFrames)
    this.objectLayer.addChild(this.player.sprite)
  }

  private createNPCs() {
    // 计算当前游戏时间（初始化时用真实时间）
    const now = new Date()
    const gameTimeMinutes = now.getHours() * 60 + now.getMinutes()

    for (const npcData of NPC_SCHEDULES) {
      const getNpcFrames = (_spriteIndex: number, direction: string): Texture[] => {
        return getHumanFrames(this.humanFrames, direction)
      }
      const npc = new NPC(npcData, getNpcFrames)
      npc.initToCurrentTime(gameTimeMinutes)  // 直接跳到当前时间的位置
      npc.onClick = (id) => {
        this.onNpcClick?.(id, npc.currentActivity)
      }
      this.npcs.push(npc)
      this.objectLayer.addChild(npc.container)
    }
  }

  private update(ticker: any) {
    const dt = ticker.deltaTime / 60

    // 游戏时间
    const now = new Date()
    if (this.timeMultiplier === 1) {
      // 真实时间模式：直接读系统时钟（含秒的小数部分让时间平滑推进）
      this.gameTimeMinutes = now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60
    } else {
      // 加速模式：从当前真实时间开始加速流逝
      const realSec = now.getHours() * 3600 + now.getMinutes() * 60 + now.getSeconds()
      if (this._accelBaseRealSec === 0) {
        this._accelBaseRealSec = realSec
        this._accelBaseGameMin = this.gameTimeMinutes
      }
      const elapsedSec = realSec - this._accelBaseRealSec
      this.gameTimeMinutes = this._accelBaseGameMin + (elapsedSec * this.timeMultiplier) / 60
      this.gameTimeMinutes = ((this.gameTimeMinutes % 1440) + 1440) % 1440
    }

    this.player?.update(dt)

    for (const npc of this.npcs) {
      npc.update(this.gameTimeMinutes, dt)
    }

    // Z 排序：建筑+角色统一按 y 位置排序（低处遮挡高处）
    if (this.player) this.player.sprite.zIndex = this.player.tileY * TILE_SIZE + TILE_SIZE - 1
    for (const npc of this.npcs) npc.container.zIndex = npc.tileY * TILE_SIZE + TILE_SIZE - 1
    this.objectLayer.sortChildren()

    // 建筑透明度：玩家走到建筑后面时，该建筑半透明
    this.updateBuildingTransparency()

    if (this.player && this.camera) {
      this.camera.follow(this.player.worldX, this.player.worldY, ticker.deltaTime)
    }

    const hours = Math.floor(this.gameTimeMinutes / 60) % 24
    const mins = Math.floor(this.gameTimeMinutes % 60)
    this.onTimeUpdate?.(
      `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`
    )
    this.onGameTimeUpdate?.(this.gameTimeMinutes)
  }

  /** 外部设置玩家摇杆输入 */
  setPlayerJoystick(dx: number, dy: number) {
    this.player?.setJoystickInput(dx, dy)
  }

  /** 获取玩家位置（tile坐标） */
  get playerPos() {
    return this.player ? { x: this.player.tileX, y: this.player.tileY } : { x: 0, y: 0 }
  }

  /** 获取所有NPC位置 */
  get npcPositions() {
    return this.npcs.map(n => ({ x: n.tileX, y: n.tileY, id: n.id }))
  }

  destroy() {
    // 清理键盘监听
    if (this.onKeyDown) {
      window.removeEventListener('keydown', this.onKeyDown)
      this.onKeyDown = null
    }
    // 清理 resize 监听器
    if (this.onResize) {
      window.removeEventListener('resize', this.onResize)
      this.onResize = null
    }
    // 清理 ticker
    if (this.updateBound && this.app) {
      this.app.ticker.remove(this.updateBound)
      this.updateBound = null
    }
    // 清理玩家键盘监听
    this.player?.destroy()
    // 清理 NPC
    for (const npc of this.npcs) {
      npc.destroy()
    }
    this.npcs = []
    // 销毁 PixiJS
    this.app?.destroy(true)
    this.app = null
  }
}
