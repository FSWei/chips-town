<template>
  <div class="minimap-wrap" :class="{ expanded }" @click="expanded = !expanded">
    <canvas ref="canvasRef" class="minimap-canvas" />
    <div class="minimap-label">MAP</div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { MAP_WIDTH, MAP_HEIGHT, TILE_SIZE } from '@/game/tilemap'
import { GROUND_DATA, OBJECT_DATA } from '@/game/map-data'

const props = defineProps<{
  playerX?: number
  playerY?: number
  npcs?: { x: number; y: number; id: string }[]
}>()

const canvasRef = ref<HTMLCanvasElement>()
const expanded = ref(false)
let ctx: CanvasRenderingContext2D | null = null

const MINIMAP_W = 160
const MINIMAP_H = 120
const SCALE_X = MINIMAP_W / MAP_WIDTH
const SCALE_Y = MINIMAP_H / MAP_HEIGHT

// Color map for ground tiles
const GROUND_COLORS: Record<number, string> = {
  0: '#1a1a2e', // empty
}

function getGroundColor(gid: number): string {
  if (gid === 0) return '#1a1a2e'
  // Grass tiles (low GIDs)
  if (gid < 50) return '#4a7c59'
  // Road/path
  if (gid < 100) return '#8a8a8a'
  // Water
  if (gid < 150) return '#3a6ea5'
  // Building floor
  if (gid < 200) return '#6b5b4f'
  return '#3a3a3a'
}

function getObjectColor(gid: number): string {
  if (gid === 0) return ''
  // Buildings
  return '#8b7355'
}

function drawMap() {
  if (!ctx) return
  const c = canvasRef.value
  if (!c) return

  // Draw ground
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      const gid = GROUND_DATA[y]?.[x] || 0
      ctx.fillStyle = getGroundColor(gid)
      ctx.fillRect(x * SCALE_X, y * SCALE_Y, Math.ceil(SCALE_X), Math.ceil(SCALE_Y))
    }
  }

  // Draw objects (buildings)
  for (let y = 0; y < MAP_HEIGHT; y++) {
    for (let x = 0; x < MAP_WIDTH; x++) {
      const gid = OBJECT_DATA[y]?.[x] || 0
      if (gid === 0) continue
      ctx.fillStyle = getObjectColor(gid)
      ctx.fillRect(x * SCALE_X, y * SCALE_Y, Math.ceil(SCALE_X), Math.ceil(SCALE_Y))
    }
  }
}

function drawEntities() {
  if (!ctx) return
  const c = canvasRef.value
  if (!c) return

  // Redraw base map
  drawMap()

  // Draw NPCs as small dots
  if (props.npcs) {
    for (const npc of props.npcs) {
      ctx.fillStyle = '#fbbf24'
      ctx.beginPath()
      ctx.arc(npc.x * SCALE_X, npc.y * SCALE_Y, 2, 0, Math.PI * 2)
      ctx.fill()
    }
  }

  // Draw player as larger dot
  if (props.playerX !== undefined && props.playerY !== undefined) {
    ctx.fillStyle = '#ef4444'
    ctx.beginPath()
    ctx.arc(props.playerX * SCALE_X, props.playerY * SCALE_Y, 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = 1
    ctx.stroke()
  }
}

onMounted(() => {
  const c = canvasRef.value
  if (!c) return
  c.width = MINIMAP_W
  c.height = MINIMAP_H
  ctx = c.getContext('2d')
  drawMap()
})

// Update when props change
watch(() => [props.playerX, props.playerY, props.npcs], drawEntities, { deep: true })

// Periodic update
let interval = 0
onMounted(() => {
  interval = window.setInterval(drawEntities, 1000)
})
onUnmounted(() => clearInterval(interval))
</script>

<style scoped>
.minimap-wrap {
  position: fixed;
  bottom: 16px;
  left: 16px;
  width: 160px;
  height: 120px;
  border: 2px solid rgba(245, 158, 11, 0.3);
  border-radius: 8px;
  overflow: hidden;
  cursor: pointer;
  z-index: 20;
  transition: all 0.3s ease;
  box-shadow: 0 4px 16px rgba(0,0,0,0.5);
}
.minimap-wrap:hover {
  border-color: rgba(245, 158, 11, 0.6);
  transform: scale(1.05);
}
.minimap-wrap.expanded {
  width: 320px;
  height: 240px;
}
.minimap-canvas {
  width: 100%;
  height: 100%;
  image-rendering: pixelated;
}
.minimap-label {
  position: absolute;
  top: 4px;
  left: 6px;
  font-size: 9px;
  font-weight: 700;
  color: rgba(245, 158, 11, 0.7);
  letter-spacing: 0.1em;
  pointer-events: none;
}
</style>
