<template>
  <div class="daynight-overlay" :style="overlayStyle" />
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  /** Current game time in minutes (0-1440) */
  minutes: number
}>()

/**
 * Day/Night cycle color overlay
 * 05:00-07:00  dawn   — warm orange tint
 * 07:00-17:00  day    — clear (no overlay)
 * 17:00-19:00  dusk   — warm red/orange
 * 19:00-21:00  twilight — deep blue
 * 21:00-05:00  night  — dark blue overlay
 */
const overlayStyle = computed(() => {
  const m = props.minutes
  let alpha = 0
  let r = 0, g = 0, b = 0

  if (m >= 300 && m < 420) {
    // Dawn: 05:00-07:00
    const t = (m - 300) / 120
    r = Math.round(255 * (1 - t * 0.5))
    g = Math.round(140 * (1 - t))
    b = Math.round(50 * (1 - t * 0.8))
    alpha = 0.15 * (1 - t)
  } else if (m >= 420 && m < 1020) {
    // Day: 07:00-17:00 — clear
    alpha = 0
  } else if (m >= 1020 && m < 1140) {
    // Dusk: 17:00-19:00
    const t = (m - 1020) / 120
    r = 255
    g = Math.round(100 * (1 - t))
    b = Math.round(30 * (1 - t))
    alpha = 0.1 * t
  } else if (m >= 1140 && m < 1260) {
    // Twilight: 19:00-21:00
    const t = (m - 1140) / 120
    r = Math.round(255 * (1 - t))
    g = Math.round(100 * (1 - t))
    b = Math.round(80 + 100 * t)
    alpha = 0.1 + 0.15 * t
  } else {
    // Night: 21:00-05:00
    r = 10
    g = 10
    b = 40
    alpha = 0.25
  }

  return {
    backgroundColor: `rgba(${r}, ${g}, ${b}, ${alpha})`,
    pointerEvents: 'none' as const,
  }
})
</script>

<style scoped>
.daynight-overlay {
  position: fixed;
  inset: 0;
  z-index: 2;
  transition: background-color 60s linear;
  mix-blend-mode: multiply;
}
</style>
