import { AnimatedSprite, Texture } from 'pixi.js'
import { TILE_SIZE, isWalkable } from './tilemap'
import type { Direction } from './types'

const SPEED = 5 // tiles per second

export class Player {
  sprite: AnimatedSprite
  tileX: number
  tileY: number
  direction: Direction = 'down'
  isMoving = false

  private targetPixelX: number
  private targetPixelY: number

  private keys = { up: false, down: false, left: false, right: false }
  private joystickX = 0
  private joystickY = 0
  private dirFrames: Record<string, Texture[]> = {}
  private dirIdleFrames: Record<string, Texture> = {}

  // 保存监听器引用用于清理
  private onKeyDown: (e: KeyboardEvent) => void
  private onKeyUp: (e: KeyboardEvent) => void

  constructor(startX: number, startY: number, humanFrames: Map<string, Texture[]>) {
    this.tileX = startX
    this.tileY = startY
    this.targetPixelX = startX * TILE_SIZE
    this.targetPixelY = startY * TILE_SIZE + TILE_SIZE // 脚底对齐 tile 底部

    // human-01.png: 每方向3帧 [walk1, idle, walk2]
    for (const dir of ['down', 'left', 'right', 'up']) {
      const frames = humanFrames.get(dir) ?? []
      this.dirIdleFrames[dir] = frames[1] ?? frames[0]  // 中间帧为idle
      this.dirFrames[dir] = [frames[0], frames[2]]       // 两帧走路
    }

    this.sprite = new AnimatedSprite(this.dirFrames.down)
    this.sprite.anchor.set(0, 1) // 锚点在底部（脚底）
    this.sprite.x = this.targetPixelX
    this.sprite.y = this.targetPixelY
    this.sprite.animationSpeed = 0.15
    this.sprite.loop = true

    // 绑定键盘事件（保存引用以便清理）
    this.onKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': this.keys.up = true; break
        case 'ArrowDown': case 's': case 'S': this.keys.down = true; break
        case 'ArrowLeft': case 'a': case 'A': this.keys.left = true; break
        case 'ArrowRight': case 'd': case 'D': this.keys.right = true; break
      }
    }
    this.onKeyUp = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp': case 'w': case 'W': this.keys.up = false; break
        case 'ArrowDown': case 's': case 'S': this.keys.down = false; break
        case 'ArrowLeft': case 'a': case 'A': this.keys.left = false; break
        case 'ArrowRight': case 'd': case 'D': this.keys.right = false; break
      }
    }
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
  }

  setJoystickInput(dx: number, dy: number) {
    this.joystickX = dx
    this.joystickY = dy
  }

  update(dt: number) {
    const pixelDt = SPEED * TILE_SIZE * dt

    const dx = this.targetPixelX - this.sprite.x
    const dy = this.targetPixelY - this.sprite.y
    const dist = Math.sqrt(dx * dx + dy * dy)

    if (dist > 0.5) {
      const step = Math.min(pixelDt, dist)
      this.sprite.x += (dx / dist) * step
      this.sprite.y += (dy / dist) * step
      this.isMoving = true
      this.sprite.play()
      return
    }

    this.sprite.x = this.targetPixelX
    this.sprite.y = this.targetPixelY
    this.isMoving = false
    this.sprite.stop()

    // 静止时显示idle帧
    this.sprite.textures = [this.dirIdleFrames[this.direction]]
    this.sprite.gotoAndStop(0)

    let moveDir: { dx: number; dy: number; dir: Direction } | null = null

    // 键盘：支持斜向移动（W+A=左上, W+D=右上, S+A=左下, S+D=右下）
    let kdx = 0, kdy = 0
    if (this.keys.left) kdx -= 1
    if (this.keys.right) kdx += 1
    if (this.keys.up) kdy -= 1
    if (this.keys.down) kdy += 1

    if (kdx !== 0 || kdy !== 0) {
      let dir: Direction
      if (Math.abs(kdy) >= Math.abs(kdx)) {
        dir = kdy > 0 ? 'down' : 'up'
      } else {
        dir = kdx > 0 ? 'right' : 'left'
      }
      moveDir = { dx: kdx, dy: kdy, dir }
    }

    // 摇杆：也支持斜向
    if (!moveDir && (Math.abs(this.joystickX) > 0.3 || Math.abs(this.joystickY) > 0.3)) {
      let jdx = 0, jdy = 0
      if (this.joystickX > 0.3) jdx = 1
      else if (this.joystickX < -0.3) jdx = -1
      if (this.joystickY > 0.3) jdy = 1
      else if (this.joystickY < -0.3) jdy = -1

      let dir: Direction
      if (Math.abs(this.joystickY) >= Math.abs(this.joystickX)) {
        dir = this.joystickY > 0 ? 'down' : 'up'
      } else {
        dir = this.joystickX > 0 ? 'right' : 'left'
      }
      moveDir = { dx: jdx, dy: jdy, dir }
    }

    if (moveDir) {
      this.direction = moveDir.dir
      this.sprite.textures = this.dirFrames[moveDir.dir]
      this.sprite.gotoAndStop(0)

      const newX = this.tileX + moveDir.dx
      const newY = this.tileY + moveDir.dy
      if (isWalkable(newX, newY)) {
        this.tileX = newX
        this.tileY = newY
        this.targetPixelX = newX * TILE_SIZE
        this.targetPixelY = newY * TILE_SIZE + TILE_SIZE // 脚底对齐
      }
    }
  }

  /** 清理监听器，防止内存泄漏 */
  destroy() {
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
  }

  get worldX(): number { return this.sprite.x + TILE_SIZE / 2 }
  /** 脚底位置（用于 camera 跟随） */
  get worldY(): number { return this.sprite.y }
}
