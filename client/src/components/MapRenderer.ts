import { Application, Graphics, Text, Container } from 'pixi.js'
import buildingsData from '@/data/buildings.json'

const TILE_SIZE = 64

interface Building {
  id: string
  name: string
  x: number
  y: number
  width: number
  height: number
  color: string
  roofColor: string | null
  npcId: string | null
}

function hexToNum(hex: string): number {
  return parseInt(hex.replace('#', ''), 16)
}

export async function initMap(
  canvas: HTMLCanvasElement,
  onBuildingClick: (buildingId: string, npcId: string | null) => void
): Promise<Application> {
  const app = new Application()
  await app.init({
    canvas,
    width: TILE_SIZE * 16,
    height: TILE_SIZE * 12,
    backgroundColor: hexToNum('#1a1a2e'),
    antialias: false,
    resolution: 1,
  })

  const world = new Container()
  app.stage.addChild(world)

  // 草地背景
  const ground = new Graphics()
  ground.rect(0, 0, TILE_SIZE * 16, TILE_SIZE * 12)
  ground.fill(hexToNum('#2a3d2a'))
  world.addChild(ground)

  // 装饰性草地纹理（小色块）
  const grassDetails = new Graphics()
  for (let i = 0; i < 40; i++) {
    const gx = Math.random() * TILE_SIZE * 16
    const gy = Math.random() * TILE_SIZE * 12
    const shade = Math.random() > 0.5 ? '#2f422f' : '#253825'
    grassDetails.rect(gx, gy, 8 + Math.random() * 12, 4 + Math.random() * 6)
    grassDetails.fill(hexToNum(shade))
  }
  world.addChild(grassDetails)

  // 主道路（横向）
  const road = new Graphics()
  road.rect(0, TILE_SIZE * 5, TILE_SIZE * 16, TILE_SIZE)
  road.fill(hexToNum('#5a4a3a'))
  // 道路边缘
  road.rect(0, TILE_SIZE * 5, TILE_SIZE * 16, 2)
  road.fill(hexToNum('#6a5a4a'))
  road.rect(0, TILE_SIZE * 6 - 2, TILE_SIZE * 16, 2)
  road.fill(hexToNum('#4a3a2a'))
  world.addChild(road)

  // 小径（纵向连接道路和建筑区域）
  const paths = new Graphics()
  // 上区小径
  paths.rect(TILE_SIZE * 3, TILE_SIZE * 5, TILE_SIZE, TILE_SIZE)
  paths.fill(hexToNum('#5a4a3a'))
  paths.rect(TILE_SIZE * 7, TILE_SIZE * 5, TILE_SIZE, TILE_SIZE)
  paths.fill(hexToNum('#5a4a3a'))
  paths.rect(TILE_SIZE * 11, TILE_SIZE * 5, TILE_SIZE, TILE_SIZE)
  paths.fill(hexToNum('#5a4a3a'))
  world.addChild(paths)

  // 绘制建筑
  const buildings = buildingsData as Building[]
  for (const b of buildings) {
    const container = new Container()
    container.x = b.x * TILE_SIZE
    container.y = b.y * TILE_SIZE
    container.eventMode = b.npcId ? 'static' : 'auto'
    container.cursor = b.npcId ? 'pointer' : 'default'

    if (b.id === 'pond') {
      // 池塘 — 椭圆
      const pond = new Graphics()
      const cx = (b.width * TILE_SIZE) / 2
      const cy = (b.height * TILE_SIZE) / 2
      pond.ellipse(cx, cy, cx - 4, cy - 4)
      pond.fill(hexToNum('#2a5a8a'))
      // 水面反光
      const shine = new Graphics()
      shine.ellipse(cx - 10, cy - 8, 12, 6)
      shine.fill(hexToNum('#4a8abd'))
      container.addChild(pond)
      container.addChild(shine)
    } else if (b.id === 'garden') {
      // 花圃 — 开放式，无屋顶
      const body = new Graphics()
      body.rect(0, 0, b.width * TILE_SIZE, b.height * TILE_SIZE)
      body.fill(hexToNum('#3a5a2a'))
      // 花圃边框
      body.rect(0, 0, b.width * TILE_SIZE, 3)
      body.fill(hexToNum('#5a7a3a'))
      body.rect(0, b.height * TILE_SIZE - 3, b.width * TILE_SIZE, 3)
      body.fill(hexToNum('#5a7a3a'))
      // 花朵装饰
      const flowers = new Graphics()
      const flowerColors = ['#d4547a', '#e8a040', '#7ab0e0', '#e0e060']
      for (let i = 0; i < 8; i++) {
        const fx = 16 + Math.random() * (b.width * TILE_SIZE - 32)
        const fy = 16 + Math.random() * (b.height * TILE_SIZE - 32)
        flowers.circle(fx, fy, 4)
        flowers.fill(hexToNum(flowerColors[i % flowerColors.length]))
      }
      container.addChild(body)
      container.addChild(flowers)
    } else {
      // 普通建筑
      const body = new Graphics()
      body.rect(0, 0, b.width * TILE_SIZE, b.height * TILE_SIZE)
      body.fill(hexToNum(b.color))
      // 建筑边框
      body.rect(0, 0, b.width * TILE_SIZE, 2)
      body.fill(hexToNum('#000000'), 0.15)
      body.rect(0, b.height * TILE_SIZE - 2, b.width * TILE_SIZE, 2)
      body.fill(hexToNum('#000000'), 0.15)
      container.addChild(body)

      // 屋顶
      if (b.roofColor) {
        const roof = new Graphics()
        roof.rect(-6, -14, b.width * TILE_SIZE + 12, 18)
        roof.fill(hexToNum(b.roofColor))
        container.addChild(roof)
      }

      // 窗户
      if (b.id !== 'pond') {
        const windows = new Graphics()
        const winSize = 16
        const cols = Math.floor((b.width * TILE_SIZE - 40) / (winSize + 12))
        const rows = Math.floor((b.height * TILE_SIZE - 40) / (winSize + 12))
        for (let r = 0; r < Math.min(rows, 2); r++) {
          for (let c = 0; c < Math.min(cols, 3); c++) {
            const wx = 24 + c * (winSize + 12)
            const wy = 24 + r * (winSize + 12)
            windows.rect(wx, wy, winSize, winSize)
            windows.fill(hexToNum('#2a2a3e'))
            // 窗框
            windows.rect(wx + winSize / 2 - 1, wy, 2, winSize)
            windows.fill(hexToNum(b.color))
            windows.rect(wx, wy + winSize / 2 - 1, winSize, 2)
            windows.fill(hexToNum(b.color))
          }
        }
        container.addChild(windows)
      }
    }

    // 建筑名称标签
    const label = new Text({
      text: b.name,
      style: {
        fontFamily: 'Noto Sans SC, system-ui',
        fontSize: 13,
        fill: 0xf0e6d3,
        align: 'center',
        dropShadow: {
          color: 0x000000,
          blur: 3,
          distance: 1,
        },
      },
    })
    label.anchor.set(0.5)
    label.x = (b.width * TILE_SIZE) / 2
    label.y = b.height * TILE_SIZE + 12
    container.addChild(label)

    // 点击事件
    if (b.npcId) {
      container.on('pointertap', () => onBuildingClick(b.id, b.npcId))
      container.on('pointerover', () => {
        container.alpha = 0.85
      })
      container.on('pointerout', () => {
        container.alpha = 1
      })
    }

    world.addChild(container)
  }

  // NPC 头像（DiceBear 像素风占位）
  const npcBuildings = buildings.filter(b => b.npcId)
  for (const b of npcBuildings) {
    try {
      const avatarUrl = `https://api.dicebear.com/8.x/pixel-art/svg?seed=${b.npcId}&size=48&backgroundColor=transparent`
      const { Sprite, Texture } = await import('pixi.js')
      const texture = await Texture.fromURL(avatarUrl)
      const avatar = new Sprite(texture)
      avatar.width = 40
      avatar.height = 40
      avatar.x = b.x * TILE_SIZE + (b.width * TILE_SIZE) / 2 - 20
      avatar.y = b.y * TILE_SIZE - 48
      world.addChild(avatar)

      // 呼吸动画
      let tick = Math.random() * Math.PI * 2
      app.ticker.add(() => {
        tick += 0.03
        avatar.y = b.y * TILE_SIZE - 48 + Math.sin(tick) * 3
      })
    } catch {
      // DiceBear 加载失败时用色块占位
      const dot = new Graphics()
      dot.circle(0, 0, 8)
      dot.fill(hexToNum('#e8a87c'))
      dot.x = b.x * TILE_SIZE + (b.width * TILE_SIZE) / 2
      dot.y = b.y * TILE_SIZE - 24
      world.addChild(dot)
    }
  }

  return app
}
