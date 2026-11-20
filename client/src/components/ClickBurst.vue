<template>
  <Teleport to="body">
    <div class="click-burst-container">
      <canvas ref="canvasRef" class="click-burst-canvas" />
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const canvasRef = ref<HTMLCanvasElement>()
let raf = 0

interface Burst {
  x: number; y: number
  particles: BurstParticle[]
  life: number
}

interface BurstParticle {
  x: number; y: number
  vx: number; vy: number
  size: number
  alpha: number
  hue: number
  decay: number
}

onMounted(() => {
  const canvas = canvasRef.value!
  const ctx = canvas.getContext('2d')!
  const bursts: Burst[] = []

  function resize() {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }
  resize()
  window.addEventListener('resize', resize)

  function createBurst(x: number, y: number) {
    const burst: Burst = { x, y, particles: [], life: 0 }
    const count = 8 + Math.floor(Math.random() * 8)
    
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5
      const speed = 2 + Math.random() * 4
      burst.particles.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 1.5 + Math.random() * 2,
        alpha: 0.8 + Math.random() * 0.2,
        hue: 35 + Math.random() * 20, // gold range
        decay: 0.02 + Math.random() * 0.02,
      })
    }
    bursts.push(burst)
  }

  // Listen for click events on buttons
  document.addEventListener('click', (e) => {
    const target = e.target as HTMLElement
    if (target.closest('button, .sb-card, .date-chip, .nav-btn, .tl-trigger')) {
      createBurst(e.clientX, e.clientY)
    }
  })

  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    for (let i = bursts.length - 1; i >= 0; i--) {
      const burst = bursts[i]
      burst.life++

      for (let j = burst.particles.length - 1; j >= 0; j--) {
        const p = burst.particles[j]
        p.x += p.vx
        p.y += p.vy
        p.vy += 0.1 // gravity
        p.vx *= 0.98
        p.vy *= 0.98
        p.alpha -= p.decay

        if (p.alpha <= 0) {
          burst.particles.splice(j, 1)
          continue
        }

        ctx.globalAlpha = p.alpha
        ctx.fillStyle = `hsl(${p.hue}, 90%, 70%)`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()

        // Glow
        ctx.globalAlpha = p.alpha * 0.3
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size * 2, 0, Math.PI * 2)
        ctx.fill()
      }

      if (burst.particles.length === 0) bursts.splice(i, 1)
    }

    ctx.globalAlpha = 1
    raf = requestAnimationFrame(loop)
  }

  raf = requestAnimationFrame(loop)

  onUnmounted(() => {
    cancelAnimationFrame(raf)
    window.removeEventListener('resize', resize)
  })
})
</script>

<style scoped>
.click-burst-container {
  position: fixed;
  inset: 0;
  pointer-events: none;
  z-index: 9999;
}
.click-burst-canvas {
  width: 100%;
  height: 100%;
}
</style>
