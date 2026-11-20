# Chips Town 地图工作流

## 目录结构

```
map/
├── tilesets/
│   ├── cleancity-tilemap.png   ← CleanCity 原始素材图 (640×416, 40×26 tiles)
│   └── cleancity.tsx           ← Tiled tileset 定义文件
├── maps/
│   └── town.tmx                ← Tiled 地图文件（在这里画地图）
├── scripts/
│   └── convert.js              ← Tiled JSON → 游戏格式 转换脚本
├── tile-labels.json            ← tile 分类标注数据
└── README.md                   ← 本文件
```

## 工作流

### 1. 用 Tiled 画地图

1. 打开 **Tiled** → **File → Open** → 选择 `map/maps/town.tmx`
2. tileset 已经配好了，直接在地图上画

#### 画图工具

| 工具 | 快捷键 | 用途 |
|------|--------|------|
| Stamp Brush | B | 手动画 tile |
| Terrain Brush | T | 自动边缘（画草地自动选正确的边角 tile） |
| Rectangular Fill | R | 矩形填充 |
| Eraser | E | 擦除 |
| Bucket Fill | G | 同类区域填充 |

#### 图层

- **ground**: 草地、马路、水面等地面 tile
- **objects**: 建筑、树木、围栏等遮挡物

#### 随机变体

在 Tiled 中实现两种草地随机混合：
1. 选中多个 tile（按住 Ctrl 点击）
2. 用 Stamp Brush 画，Tiled 会随机选一个

### 2. 标记 Walkability（可走性）

1. **View → Tilesets** 打开 tileset 面板
2. **右键一个 tile → Tile Properties**
3. 添加属性 `walkable` (bool)，建筑/水/树设为 false
4. 转换脚本会自动根据这个属性生成碰撞数据

### 3. 导出

画好地图后：
1. **File → Export As → JSON** → 保存到 `map/maps/town.json`
2. 运行转换脚本：

```bash
node map/scripts/convert.js
```

3. 脚本会生成 `client/src/game/map-data.ts`，游戏直接 import 使用

## Tileset 说明

CleanCity tileset 是 40×26 的 tile 集合（共 1040 个 tile）。
- 索引 = row × 40 + col（左上角为 0）
- Tiled 中 `firstgid=1`（Tiled 惯例，0 表示空），所以 Tiled 里的 tile ID = CleanCity 索引 + 1

## 注意事项

- 地图尺寸保持 60×45（跟游戏一致）
- 修改 tileset 后需要在 Tiled 里刷新：**Tileset → 右键 → Reload**
