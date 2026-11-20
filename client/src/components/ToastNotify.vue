<template>
  <Teleport to="body">
    <div class="toast-container">
      <TransitionGroup name="toast">
        <div
          v-for="toast in toasts" :key="toast.id"
          class="toast" :class="toast.type"
        >
          <span class="toast-icon">{{ icons[toast.type] }}</span>
          <span class="toast-msg">{{ toast.message }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue'

interface Toast {
  id: number
  message: string
  type: 'info' | 'success' | 'warning' | 'error'
}

const toasts = ref<Toast[]>([])
let nextId = 0

const icons: Record<string, string> = {
  info: '💡',
  success: '✓',
  warning: '⚠',
  error: '✕',
}

function show(message: string, type: Toast['type'] = 'info', duration = 3000) {
  const id = nextId++
  toasts.value.push({ id, message, type })
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, duration)
}

defineExpose({ show })
</script>

<style scoped>
.toast-container {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10000;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  pointer-events: none;
}

.toast {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  background: var(--ink-900);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-md);
  backdrop-filter: blur(8px);
  box-shadow: 0 4px 20px rgba(0,0,0,0.4);
  pointer-events: auto;
  animation: toastIn 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.toast.info { border-color: var(--info); }
.toast.success { border-color: var(--success); }
.toast.warning { border-color: var(--warning); }
.toast.error { border-color: var(--error); }

.toast-icon {
  font-size: 14px;
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}
.toast.info .toast-icon { background: rgba(79,195,247,0.2); color: var(--info); }
.toast.success .toast-icon { background: rgba(102,187,106,0.2); color: var(--success); }
.toast.warning .toast-icon { background: rgba(245,158,11,0.2); color: var(--warning); }
.toast.error .toast-icon { background: rgba(239,68,68,0.2); color: var(--error); }

.toast-msg {
  font-size: 13px;
  color: var(--ink-200);
  font-weight: 500;
}

.toast-enter-active {
  transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.toast-leave-active {
  transition: all 0.3s ease;
}
.toast-enter-from {
  opacity: 0;
  transform: translateY(-20px) scale(0.9);
}
.toast-leave-to {
  opacity: 0;
  transform: translateY(-10px) scale(0.95);
}

@keyframes toastIn {
  from { opacity: 0; transform: translateY(-20px) scale(0.9); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
</style>
