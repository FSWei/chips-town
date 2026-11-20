<template>
  <Transition name="loading-fade">
    <div v-if="visible" class="loading-screen">
      <div class="loading-content">
        <h1 class="loading-title">Chips Town</h1>
        <p class="loading-sub">芯 火 镇</p>
        <div class="loading-bar-wrap">
          <div class="loading-bar" />
        </div>
        <div class="loading-dots">
          <span class="dot" />
          <span class="dot" />
          <span class="dot" />
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const visible = ref(true)

onMounted(() => {
  // Hide after game loads (GameCanvas will emit when ready)
  setTimeout(() => { visible.value = false }, 2000)
})

function hide() { visible.value = false }
defineExpose({ hide })
</script>

<style scoped>
.loading-screen {
  position: fixed;
  inset: 0;
  background: #0c0a09;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 99999;
}
.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}
.loading-title {
  font-family: 'Noto Serif SC', serif;
  font-size: 28px;
  font-weight: 700;
  color: #fbbf24;
  margin-bottom: 8px;
  animation: titleGlow 2s ease-in-out infinite;
}
@keyframes titleGlow {
  0%, 100% { text-shadow: 0 0 20px rgba(245,158,11,0.3); }
  50% { text-shadow: 0 0 40px rgba(245,158,11,0.6), 0 0 80px rgba(245,158,11,0.2); }
}
.loading-sub {
  font-family: 'Noto Sans SC', sans-serif;
  font-size: 14px;
  color: #78716c;
  margin-bottom: 32px;
  letter-spacing: 0.2em;
}
.loading-bar-wrap {
  width: 200px;
  height: 3px;
  background: #292524;
  border-radius: 2px;
  overflow: hidden;
  margin-bottom: 16px;
}
.loading-bar {
  height: 100%;
  background: linear-gradient(90deg, #f59e0b, #fbbf24);
  border-radius: 2px;
  animation: loadingProgress 2s ease-in-out infinite;
}
@keyframes loadingProgress {
  0% { width: 0%; transform: translateX(0); }
  50% { width: 60%; }
  100% { width: 0%; transform: translateX(200px); }
}
.loading-dots {
  display: flex;
  gap: 6px;
}
.dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #f59e0b;
  animation: dotPulse 1.4s ease-in-out infinite;
}
.dot:nth-child(2) { animation-delay: 0.2s; }
.dot:nth-child(3) { animation-delay: 0.4s; }
@keyframes dotPulse {
  0%, 100% { opacity: 0.3; transform: scale(0.8); }
  50% { opacity: 1; transform: scale(1.2); }
}

/* Fade out transition */
.loading-fade-leave-active {
  transition: opacity 0.8s ease;
}
.loading-fade-leave-to {
  opacity: 0;
}
</style>
