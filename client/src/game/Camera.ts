import { Container, Application } from 'pixi.js'
import { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE, SCALE } from './tilemap'

const LERP_SPEED = 0.08

export class Camera {
  private world: Container
  private screenWidth: number
  private screenHeight: number
  private mapPixelWidth: number
  private mapPixelHeight: number
  private scale: number

  constructor(world: Container, app: Application, scale: number) {
    this.world = world
    this.scale = scale
    this.screenWidth = app.screen.width
    this.screenHeight = app.screen.height
    // 地图像素尺寸（缩放后）
    this.mapPixelWidth = MAP_WIDTH * TILE_SIZE * scale
    this.mapPixelHeight = MAP_HEIGHT * TILE_SIZE * scale
  }

  updateScreenSize(w: number, h: number) {
    this.screenWidth = w
    this.screenHeight = h
  }

  /**
   * 平滑跟随目标位置
   * targetX/Y 是世界坐标（未缩放），需要乘以 scale
   */
  follow(targetX: number, targetY: number, dt: number) {
    const scaledX = targetX * this.scale
    const scaledY = targetY * this.scale

    let goalX = -scaledX + this.screenWidth / 2
    let goalY = -scaledY + this.screenHeight / 2

    // Clamp 到地图边界
    const minX = -(this.mapPixelWidth - this.screenWidth)
    const minY = -(this.mapPixelHeight - this.screenHeight)

    goalX = Math.min(0, Math.max(minX, goalX))
    goalY = Math.min(0, Math.max(minY, goalY))

    // 平滑插值
    const lerpFactor = 1 - Math.pow(1 - LERP_SPEED, dt)
    this.world.x += (goalX - this.world.x) * lerpFactor
    this.world.y += (goalY - this.world.y) * lerpFactor
  }

  /**
   * 立即设置 camera 位置（用于初始化）
   */
  snapTo(targetX: number, targetY: number) {
    const scaledX = targetX * this.scale
    const scaledY = targetY * this.scale

    let goalX = -scaledX + this.screenWidth / 2
    let goalY = -scaledY + this.screenHeight / 2

    const minX = -(this.mapPixelWidth - this.screenWidth)
    const minY = -(this.mapPixelHeight - this.screenHeight)

    this.world.x = Math.min(0, Math.max(minX, goalX))
    this.world.y = Math.min(0, Math.max(minY, goalY))
  }
}
