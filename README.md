# 🏘️ Chips Town — 芯火镇

AI 驱动的虚拟小镇生活模拟器。NPC 每天由 LLM 生成生活日志，前端以治愈风格展示。

## 快速开始

```bash
# 安装依赖
npm install

# 重建 native 模块（better-sqlite3）
npm rebuild better-sqlite3

# 初始化数据库 + 种子数据
npm run seed

# 启动开发服务器（前端 + 后端）
npm run dev
```

- 前端: http://localhost:5173
- 后端: http://localhost:3000
- API 健康检查: http://localhost:3000/api/health

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | Vue 3 + TypeScript + Vite |
| 2D 渲染 | PixiJS v8（精灵/tilemap/交互） |
| CSS | 原生 CSS + CSS 变量（暖色暗色调） |
| 状态管理 | Pinia |
| 后端 | Express.js 5 + TypeScript |
| 数据库 | SQLite (better-sqlite3) |
| 头像 | DiceBear pixel-art（占位） |

## 项目结构

```
chips-town/
├── client/                  # 前端
│   ├── src/
│   │   ├── api/client.ts    # API 客户端
│   │   ├── components/      # UI 组件
│   │   │   ├── MapRenderer.ts    # PixiJS 地图渲染
│   │   │   ├── JournalCard.vue   # 日志卡片
│   │   │   ├── JournalDetail.vue # 日志详情
│   │   │   └── RelationGraph.vue # 关系网络
│   │   ├── views/           # 页面
│   │   │   ├── TownMap.vue       # 小镇地图（首页）
│   │   │   └── NpcDetail.vue     # NPC 详情
│   │   ├── stores/npc.ts    # Pinia NPC store
│   │   ├── data/buildings.json  # 建筑布局配置
│   │   └── styles/global.css    # 设计 Token
│   └── index.html
├── server/                  # 后端
│   ├── src/
│   │   ├── index.ts         # Express 入口
│   │   ├── routes/          # API 路由
│   │   │   ├── health.ts        # 健康检查
│   │   │   └── npcs.ts          # NPC CRUD
│   │   └── db/              # 数据库
│   │       ├── schema.ts        # 表结构
│   │       ├── index.ts         # 连接
│   │       └── seed.ts          # 种子脚本
│   └── data/                # 种子数据
│       ├── npcs.json            # NPC 配置
│       ├── sample-journals.json # 示例日志
│       └── relationships.json   # NPC 关系
└── package.json             # workspace root
```

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/health` | 健康检查 |
| GET | `/api/npcs` | NPC 列表 |
| GET | `/api/npcs/relationships` | 所有关系 |
| GET | `/api/npcs/:id` | NPC 详情 |
| GET | `/api/npcs/:id/journals` | 日志列表 |
| GET | `/api/npcs/:id/journals/:date` | 日志详情 |

## 设计规范

- **色调**: 暖色暗色系（深夜小镇感），不用 AI 紫色
- **强调色**: 琥珀暖金 `hsl(32 80% 62%)`
- **字体**: Noto Sans SC
- **美术**: CSS 色块占位，预留无缝替换像素素材的接口

## 美术资源切换

所有可视元素尺寸通过 CSS 变量管理（`--tile-size`, `--building-width` 等）。
替换流程：`assets/sprites/` 放入 PNG → CSS 变量微调 → 代码逻辑不变。

## 开发规则

- Vue 3 Composition API + `<script setup lang="ts">`
- TypeScript strict mode，不用 `any`
- 每个 Task 完成后必须 git commit
- 前端不能有 AI 味（参照 anti-ai-frontend skill）

## 后续规划

- [ ] AI 每日定时生成日志（DeepSeek V4 Pro）
- [ ] 蒸馏用户 → NPC 注入（V2 核心功能）
- [ ] 像素美术素材替换
- [ ] 日历翻页（查看历史日期）
- [ ] 季节/天气系统
- [ ] 移动端适配
- [ ] 部署到 distillyourself.cn 子域名
