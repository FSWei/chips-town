<template>
  <div
    v-if="isMobile || forceShow"
    class="joystick-zone"
    @touchstart.prevent="onTouchStart"
    @touchmove.prevent="onTouchMove"
    @touchend.prevent="onTouchEnd"
    @touchcancel.prevent="onTouchEnd"
  >
    <div
      v-show="active"
      class="joystick-base"
      :style="{ left: baseX + 'px', top: baseY + 'px' }"
    >
      <div
        class="joystick-knob"
        :style="{ transform: `translate(${knobX}px, ${knobY}px)` }"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

export interface JoystickState {
  dx: number // -1 to 1
  dy: number // -1 to 1
  active: boolean
}

const emit = defineEmits<{
  (e: 'input', state: JoystickState): void
}>()

const isMobile = ref(false)
const forceShow = ref(false)
const active = ref(false)
const baseX = ref(0)
const baseY = ref(0)
const knobX = ref(0)
const knobY = ref(0)

const RADIUS = 50 // 摇杆半径
let touchId: number | null = null

onMounted(() => {
  isMobile.value = 'ontouchstart' in window || navigator.maxTouchPoints > 0
  // URL 参数 ?touch=1 或键盘 J 键切换摇杆（方便桌面测试）
  if (new URLSearchParams(window.location.search).has('touch')) {
    forceShow.value = true
  }
  window.addEventListener('keydown', (e) => {
    if (e.key === 'j' || e.key === 'J') forceShow.value = !forceShow.value
  })
})

function onTouchStart(e: TouchEvent) {
  const touch = e.changedTouches[0]
  touchId = touch.identifier
  baseX.value = touch.clientX
  baseY.value = touch.clientY
  active.value = true
  knobX.value = 0
  knobY.value = 0
  emit('input', { dx: 0, dy: 0, active: true })
}

function onTouchMove(e: TouchEvent) {
  if (touchId === null) return
  const touch = findTouch(e.changedTouches, touchId)
  if (!touch) return

  let dx = touch.clientX - baseX.value
  let dy = touch.clientY - baseY.value
  const dist = Math.sqrt(dx * dx + dy * dy)

  // 限制在半径内
  if (dist > RADIUS) {
    dx = (dx / dist) * RADIUS
    dy = (dy / dist) * RADIUS
  }

  knobX.value = dx
  knobY.value = dy

  // 归一化到 -1 ~ 1
  const normDx = dist > 5 ? dx / RADIUS : 0
  const normDy = dist > 5 ? dy / RADIUS : 0
  emit('input', { dx: normDx, dy: normDy, active: true })
}

function onTouchEnd(e: TouchEvent) {
  if (touchId === null) return
  const touch = findTouch(e.changedTouches, touchId)
  if (!touch) return

  touchId = null
  active.value = false
  knobX.value = 0
  knobY.value = 0
  emit('input', { dx: 0, dy: 0, active: false })
}

function findTouch(touches: TouchList, id: number): Touch | null {
  for (let i = 0; i < touches.length; i++) {
    if (touches[i].identifier === id) return touches[i]
  }
  return null
}
</script>

<style scoped>
.joystick-zone {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 50%;
  height: 50%;
  z-index: 15;
  touch-action: none;
}

.joystick-base {
  position: fixed;
  width: 120px;
  height: 120px;
  margin-left: -60px;
  margin-top: -60px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(245,158,11,0.15), rgba(28,25,23,0.6));
  border: 2px solid rgba(245,158,11,0.3);
  backdrop-filter: blur(4px);
  pointer-events: none;
  animation: joystickIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  box-shadow: 0 0 20px rgba(245,158,11,0.1), inset 0 0 10px rgba(245,158,11,0.05);
}
@keyframes joystickIn {
  from { transform: scale(0); opacity: 0; }
  to { transform: scale(1); opacity: 1; }
}

.joystick-knob {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 48px;
  height: 48px;
  margin-left: -24px;
  margin-top: -24px;
  border-radius: 50%;
  background: radial-gradient(circle at 30% 30%, var(--gold-400), var(--gold-500));
  border: 2px solid var(--gold-300);
  box-shadow: 0 2px 12px rgba(0,0,0,0.3), 0 0 16px var(--gold-glow);
  transition: transform 0.1s ease;
}
</style>
