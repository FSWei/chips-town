# Chips Town 前端升级计划

> 从"CSS 色块原型"升级到"2D 像素风游戏"

## 问题诊断

当前版本（MVP v0.1）的问题：
1. **没有玩家角色**——上帝视角展示全图，没有 camera 跟随
2. **没有可见 NPC**——只有建筑 + DiceBear 头像点，NPC 不会走动
3. **美术太差**——纯色块占位，没有像素风 tilemap
4. **没有游戏感**——不像游戏，像数据可视化 demo

## 升级目标

做一个**星露谷物语风格的 2D 像素小镇**：
- 玩家操控角色在 tilemap 上走动，camera 跟随
- NPC 有日程表，会按时间出现在不同地点，有行走动画
- 16x16 像素风地图（草地/道路/建筑/树木/水）
- 点击 NPC 可以查看其生活日志

## 技术选型（已确认）

| 决策 | 选择 | 理由 |
|------|------|------|
| 渲染引擎 | PixiJS v8 | 已用，a16z AI-Town 也用这个 |
| Camera | pixi-viewport 或手动 lerp | a16z 用 pixi-viewport，手动 lerp 更轻量 |
| Tilemap | 16x16 tile 数组 + PixiJS 渲染 | a16z 方案，简单高效 |
| 角色动画 | PIXI.AnimatedSprite + 精灵表 | 4 方向行走，a16z 验证可行 |
| 寻路 | pathfinding npm（A*） | 120K+ 周下载，成熟稳定 |
| 素材 | OpenGameArt CC0/CC-BY | Town Tiles + 12 RPG Sprites |
| 地图编辑 | 代码定义 tile 数组 | V1 不需要 Tiled Editor，手写数组够用 |

## 参考项目

**a16z AI-Town**（★10K）https://github.com/a16z-infra/ai-town
- PixiJS + 16x16 tilemap + AnimatedSprite 角色
- 关键文件：`PixiStaticMap.tsx`（tilemap）、`Character.tsx`（角色动画）
- `PIXI.SCALE_MODES.NEAREST` 保证像素清晰

## 升级步骤

### Step 1: 下载素材 + 安装依赖
- 下载 Town Tiles（CC0）tileset
- 下载 12 RPG Sprites（CC-BY）角色精灵表
- 安装 `pathfinding` + `@types/pathfinding`
- 放入 `client/src/assets/`

### Step 2: 重写地图系统
- 定义 tile 类型枚举（草地/道路/水/建筑/树木/不可通行）
- 创建 tilemap 数据（二维数组，每个元素 = tile 类型）
- 用 PixiJS Sprite 渲染每个 tile（从 tileset 切片）
- 多层渲染：地面层 → 物体层（建筑/树木）
- `PIXI.SCALE_MODES.NEAREST` 保证像素清晰

### Step 3: 玩家角色 + Camera
- 从精灵表创建 AnimatedSprite（4 方向行走）
- WASD/方向键控制移动
- 碰撞检测：不可通行 tile 阻止移动
- Camera：每帧 lerp 偏移 world Container，clamp 到地图边界

### Step 4: NPC 系统
- NPC 数据库表加 `sprite_key` 字段（对应精灵表中的角色）
- NPC 日程数据：JSON 定义 时间→地点→坐标
- NPCController：日程管理 + A* 寻路 + 行走动画
- 游戏循环：1 真实秒 ≈ 1 游戏分钟

### Step 5: NPC 交互
- 点击 NPC 弹出信息浮窗
- 进入 NPC 详情页查看日志（保留现有 NpcDetail.vue）

### Step 6: UI 覆盖层
- 游戏时间显示（右上角）
- 小地图（可选）
- 日志面板（DOM 层覆盖在 canvas 上）

## 素材清单

| 素材 | URL | 授权 | 用途 |
|------|-----|------|------|
| Town Tiles | opengameart.org/content/town-tiles | CC0 | 建筑/屋顶/墙壁 |
| Tiny 16: Basic | opengameart.org/content/tiny-16-basic | CC-BY | 草地/树木/水/桥梁 |
| 12 RPG Sprites | opengameart.org/content/twelve-16x18-rpg-sprites-plus-base | CC-BY | NPC 角色 |
| Zelda-like Tilesets | opengameart.org/content/zelda-like-tilesets-and-sprites | CC0 | 备选 overworld |

## 文件结构变更

```
client/src/
├── assets/
│   ├── tilesets/           # tileset PNG 文件
│   │   ├── town-tiles.png
│   │   └── tiny16.png
│   └── sprites/            # 角色精灵表
│       ├── player.png
│       └── npcs.png
├── game/
│   ├── Game.ts             # 主游戏类（init/update loop）
│   ├── TileMap.ts          # tilemap 数据 + 渲染
│   ├── Camera.ts           # camera 跟随系统
│   ├── Player.ts           # 玩家角色控制
│   ├── NPC.ts              # NPC 角色 + 日程 + 寻路
│   ├── Pathfinder.ts       # A* 寻路封装
│   ├── SpriteSheet.ts      # 精灵表切片工具
│   └── types.ts            # 游戏类型定义
├── components/
│   ├── GameCanvas.vue      # PixiJS canvas 容器
│   └── NpcPopup.vue        # NPC 信息浮窗
├── views/
│   ├── GameView.vue        # 游戏主页面（替代 TownMap.vue）
│   └── NpcDetail.vue       # NPC 详情页（保留）
└── data/
    ├── tilemap.ts          # 地图 tile 数据
    └── npc-schedules.ts    # NPC 日程数据
```

## 关键实现细节

### Camera 跟随
```typescript
// 每帧更新
const targetX = -player.x + screenWidth / 2
const targetY = -player.y + screenHeight / 2
world.x += (targetX - world.x) * 0.1 * dt
world.y += (targetY - world.y) * 0.1 * dt
// clamp 到地图边界
world.x = Math.min(0, Math.max(-(mapWidth - screenWidth), world.x))
world.y = Math.min(0, Math.max(-(mapHeight - screenHeight), world.y))
```

### NPC 日程
```typescript
// 数据格式
const schedule = [
  { time: 360, location: 'bakery', tileX: 12, tileY: 8 },    // 6:00 面包店
  { time: 480, location: 'garden', tileX: 25, tileY: 15 },   // 8:00 花圃
  { time: 720, location: 'library', tileX: 30, tileY: 20 },  // 12:00 图书馆
  { time: 1080, location: 'home', tileX: 10, tileY: 10 },    // 18:00 回家
]
```

### A* 寻路
```typescript
import PF from 'pathfinding'
const grid = new PF.Grid(mapWidth, mapHeight)
// 标记不可通行 tile
const finder = new PF.AStarFinder({
  allowDiagonal: false,
  dontCrossCorners: true,
  heuristic: PF.Heuristic.manhattan,
})
const path = finder.findPath(startX, startY, endX, endY, grid.clone())
```

## 验收标准

- [ ] 玩家角色可在 tilemap 上走动，camera 平滑跟随
- [ ] 16x16 像素风地图渲染正确，像素清晰（不模糊）
- [ ] NPC 有行走动画，按日程在不同地点出现
- [ ] NPC 遇到障碍物会自动绕路（A* 寻路）
- [ ] 点击 NPC 可查看详情和日志
- [ ] 游戏时间正常推进（1 秒 ≈ 1 分钟）
- [ ] 无 AI 味——像素风统一，不像 AI 生成的 UI
