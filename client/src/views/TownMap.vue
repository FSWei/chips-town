<template>
  <div class="town-map-page">
    <header class="town-header">
      <h1 class="town-title">Chips Town</h1>
      <p class="town-subtitle">芯火镇</p>
    </header>

    <div class="map-wrapper">
      <canvas ref="canvasRef" class="town-canvas" />
    </div>

    <!-- NPC 信息浮窗 -->
    <Transition name="popup">
      <div v-if="selectedBuilding" class="npc-popup" @click="goToNpc">
        <div class="popup-name">{{ selectedBuilding.name }}</div>
        <div class="popup-hint">点击查看日志</div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { initMap } from '@/components/MapRenderer'
import buildingsData from '@/data/buildings.json'

const router = useRouter()
const canvasRef = ref<HTMLCanvasElement>()
const selectedBuilding = ref<{ name: string; npcId: string } | null>(null)

let app: any = null

onMounted(async () => {
  if (!canvasRef.value) return
  app = await initMap(canvasRef.value, (_buildingId, npcId) => {
    if (!npcId) return
    const building = (buildingsData as any[]).find(b => b.npcId === npcId)
    if (building) {
      selectedBuilding.value = { name: building.name, npcId }
    }
  })
})

onUnmounted(() => {
  app?.destroy(true)
  app = null
})

function goToNpc() {
  if (selectedBuilding.value) {
    router.push(`/npc/${selectedBuilding.value.npcId}`)
  }
}
</script>

<style scoped>
.town-map-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-height: 100dvh;
  padding: var(--space-6) var(--space-4);
}

.town-header {
  text-align: center;
  margin-bottom: var(--space-6);
}

.town-title {
  font-size: var(--text-display);
  font-weight: 700;
  color: var(--color-accent);
  letter-spacing: -0.03em;
  line-height: 1.05;
}

.town-subtitle {
  font-size: var(--text-body);
  color: var(--color-text-secondary);
  margin-top: var(--space-2);
}

.map-wrapper {
  border: 2px solid var(--color-border);
  border-radius: var(--radius-md);
  overflow: hidden;
  box-shadow: var(--shadow-lg);
}

.town-canvas {
  display: block;
  width: var(--map-width);
  height: var(--map-height);
  image-rendering: pixelated;
}

/* NPC 弹窗 */
.npc-popup {
  position: fixed;
  bottom: var(--space-10);
  left: 50%;
  transform: translateX(-50%);
  background: var(--color-surface-1);
  border: 1px solid var(--color-accent);
  border-radius: var(--radius-lg);
  padding: var(--space-4) var(--space-8);
  cursor: pointer;
  text-align: center;
  box-shadow: var(--shadow-lg);
  z-index: var(--z-overlay);
}

.npc-popup:hover {
  background: var(--color-surface-2);
}

.popup-name {
  font-size: var(--text-heading);
  font-weight: 500;
  color: var(--color-accent);
}

.popup-hint {
  font-size: var(--text-small);
  color: var(--color-text-muted);
  margin-top: var(--space-1);
}

/* 弹窗动画 */
.popup-enter-active,
.popup-leave-active {
  transition: all var(--duration-normal) var(--ease-spring);
}

.popup-enter-from,
.popup-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(16px);
}
</style>
