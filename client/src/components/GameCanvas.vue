<template>
  <div class="gc-wrap">
    <!-- PixiJS canvas 挂载点（v-once 阻止 Vue 管理子节点） -->
    <div ref="pixiContainer" class="pixi-mount" v-once />

    <!-- 粒子层 -->
    <Particles />
    <ClickBurst />
    <DayNightCycle :minutes="gameTimeMinutes" />
    <ToastNotify ref="toastRef" />

    <!-- HUD -->
    <div class="hud">
      <div class="hud-clock" :class="{ pulse: clockPulse }">{{ currentTime }}</div>
      <div class="hud-row">
        <Transition name="badge-pop">
          <span v-if="timeMult > 1" class="hud-badge">{{ timeMult }}x</span>
        </Transition>
        <span class="hud-keys">T 加速</span>
      </div>
      <div class="hud-stats">
        <div class="stat-item">
          <span class="stat-icon">👥</span>
          <span class="stat-val">{{ npcCount }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-icon">📖</span>
          <span class="stat-val">{{ journalCount }}</span>
        </div>
      </div>
    </div>

    <!-- 小镇名称 -->
    <div class="town-name">
      <span class="town-title">Chips Town</span>
      <span class="town-sub">华北小镇</span>
    </div>

    <VirtualJoystick @input="onJoystickInput" />
    <NpcSidebar @select="onSidebarSelect" />
    <DayTimeline :current-minutes="gameTimeMinutes" />
    <MiniMap :player-x="playerX" :player-y="playerY" :npcs="npcDots" />
    <NpcPanel
      :npc="selectedNpc"
      :game-time-minutes="gameTimeMinutes"
      @close="selectedNpc = null"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'
import { Game } from '@/game/Game'
import { ALL_NPCS } from '@/data/npcLoader'
import VirtualJoystick from './VirtualJoystick.vue'
import NpcSidebar from './NpcSidebar.vue'
import NpcPanel from './NpcPanel.vue'
import DayTimeline from './DayTimeline.vue'
import Particles from './Particles.vue'
import ClickBurst from './ClickBurst.vue'
import ToastNotify from './ToastNotify.vue'
import MiniMap from './MiniMap.vue'
import DayNightCycle from './DayNightCycle.vue'

const pixiContainer = ref<HTMLDivElement>()
const currentTime = ref('06:00')
const timeMult = ref(1)
const gameTimeMinutes = ref(360)
const clockPulse = ref(false)
const npcCount = ALL_NPCS.length
const journalCount = ref(0)

interface NpcPanelData {
  id: string; name: string; nickname?: string; occupation?: string; age?: number
  personality?: string[]; description?: string; currentActivity?: string
  schedule: { time: number; tileX: number; tileY: number; activity: string }[]
  spriteIndex: number
}

const selectedNpc = ref<NpcPanelData | null>(null)
const toastRef = ref<InstanceType<typeof ToastNotify>>()
const playerX = ref(10)
const playerY = ref(10)
const npcDots = ref<{ x: number; y: number; id: string }[]>([])
let game: Game | null = null

// 时钟脉冲效果
watch(currentTime, () => {
  clockPulse.value = true
  setTimeout(() => { clockPulse.value = false }, 300)
})

function onJoystickInput(s: { dx: number; dy: number; active: boolean }) {
  game?.setPlayerJoystick(s.dx, s.dy)
}

function onSidebarSelect(id: string) {
  const n = ALL_NPCS.find(x => x.id === id)
  if (n) selectedNpc.value = {
    id: n.id, name: n.name, nickname: n.nickname, occupation: n.occupation,
    age: n.age, personality: n.personality, description: n.description,
    currentActivity: '', schedule: n.schedule, spriteIndex: n.spriteIndex,
  }
}

function openNpc(id: string, activity: string) {
  const n = ALL_NPCS.find(x => x.id === id)
  if (n) selectedNpc.value = {
    id: n.id, name: n.name, nickname: n.nickname, occupation: n.occupation,
    age: n.age, personality: n.personality, description: n.description,
    currentActivity: activity || '', schedule: n.schedule, spriteIndex: n.spriteIndex,
  }
}

// 获取日志数量
async function fetchJournalCount() {
  try {
    const res = await fetch('/api/journals/count')
    if (res.ok) { const d = await res.json(); journalCount.value = d.count || 0 }
  } catch {}
}

onMounted(async () => {
  if (!pixiContainer.value) return

  game = new Game()
  game.onTimeUpdate = t => { currentTime.value = t }
  game.onTimeMultiplierChange = m => { timeMult.value = m }
  game.onGameTimeUpdate = m => { gameTimeMinutes.value = m }
  game.onNpcClick = (id, act) => openNpc(id, act)

  await game.initWithContainer(pixiContainer.value)

  // Periodic position update for minimap
  setInterval(() => {
    if (!game) return
    const p = game.playerPos
    playerX.value = p.x
    playerY.value = p.y
    npcDots.value = game.npcPositions
  }, 500)

  fetchJournalCount()
  setTimeout(() => { toastRef.value?.show('欢迎来到 Chips Town！', 'success') }, 1500)
})

onUnmounted(() => { game?.destroy(); game = null })
</script>

<style scoped>
.gc-wrap {
  position: fixed; inset: 0;
  width: 100vw; height: 100vh; overflow: hidden;
}
.pixi-mount {
  position: absolute; inset: 0;
  width: 100%; height: 100%;
  z-index: 0;
}
/* canvas 由 PixiJS 动态创建，挂到 .pixi-mount 内 */
.pixi-mount :deep(canvas) {
  display: block; width: 100%; height: 100%;
  image-rendering: pixelated; image-rendering: crisp-edges;
}

/* ── HUD ── */
.hud {
  position: fixed; top: 10px; right: 12px;
  display: flex; flex-direction: column; align-items: flex-end; gap: 6px;
  pointer-events: none; z-index: 10;
  animation: hudFadeIn 0.8s 0.5s both;
}
@keyframes hudFadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.hud-clock {
  font-family: var(--font-display);
  font-size: 28px; font-weight: 700;
  color: var(--gold-400);
  font-variant-numeric: tabular-nums;
  text-shadow: 0 0 20px var(--gold-glow-strong), 0 2px 8px rgba(0,0,0,0.8);
  letter-spacing: -0.03em;
  line-height: 1;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.hud-clock.pulse {
  transform: scale(1.05);
  text-shadow: 0 0 30px var(--gold-glow-strong), 0 0 60px rgba(245,158,11,0.2);
}

.hud-row { display: flex; align-items: center; gap: 6px; }
.hud-badge {
  font-size: 11px; font-weight: 600;
  color: var(--gold-300);
  padding: 1px 6px;
  background: var(--gold-glow);
  border: 1px solid var(--gold-glow-strong);
  border-radius: var(--radius-full);
}
.badge-pop-enter-active { transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1); }
.badge-pop-leave-active { transition: all 0.2s ease; }
.badge-pop-enter-from, .badge-pop-leave-to { transform: scale(0); opacity: 0; }

.hud-keys {
  font-size: 10px; color: var(--ink-600);
  opacity: 0.5;
}

.hud-stats {
  display: flex; gap: 8px; margin-top: 4px;
}
.stat-item {
  display: flex; align-items: center; gap: 4px;
  padding: 2px 8px;
  background: rgba(28, 25, 23, 0.7);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-full);
  backdrop-filter: blur(4px);
}
.stat-icon { font-size: 12px; }
.stat-val { font-size: 11px; color: var(--ink-300); font-variant-numeric: tabular-nums; }

/* ── 小镇名称 ── */
.town-name {
  position: fixed; top: 10px; left: 50%; transform: translateX(-50%);
  display: flex; flex-direction: column; align-items: center;
  pointer-events: none; z-index: 10;
  animation: townFadeIn 1s 0.8s both;
}
@keyframes townFadeIn {
  from { opacity: 0; transform: translateX(-50%) translateY(-10px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}
.town-title {
  font-family: var(--font-display);
  font-size: 16px; font-weight: 700;
  color: var(--gold-400);
  text-shadow: 0 2px 8px rgba(0,0,0,0.8);
  letter-spacing: 0.1em;
}
.town-sub {
  font-size: 10px; color: var(--ink-500);
  letter-spacing: 0.2em; margin-top: 2px;
}
</style>
