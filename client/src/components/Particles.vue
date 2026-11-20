<template>
  <canvas ref="canvasRef" class="particles-canvas" />
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const canvasRef = ref<HTMLCanvasElement>()
let raf = 0

interface Particle {
  x: number; y: number
  vx: number; vy: number
  size: number; alpha: number
  life: number; maxLife: number
  hue: number
  type: 'firefly' | 'dust' | 'star'
  wobble: number
}

onMounted(() => {
  const canvas = canvasRef.value!
  const ctx = canvas.getContext('2d')!
  const particles: Particle[] = []
  let mouseX = -100, mouseY = -100

  function resize() {
    canvas.width = window.innerWidth
    canvas.height = window.innerHeight
  }
  resize()
  window.addEventListener('resize', resize)
  
  canvas.addEventListener('mousemove', (e) => {
    mouseX = e.clientX
    mouseY = e.clientY
  })

  function spawn(type: Particle['type'] = 'firefly') {
    const p: Particle = {
      x: Math.random() * canvas.width,
      y: type === 'dust' ? Math.random() * canvas.height : canvas.height + 10,
      vx: (Math.random() - 0.5) * (type === 'star' ? 2 : 0.4),
      vy: type === 'star' ? -2 - Math.random() * 2 : -0.3 - Math.random() * 0.6,
      size: type === 'dust' ? 0.5 + Math.random() : type === 'star' ? 1 : 1 + Math.random() * 2.5,
      alpha: type === 'dust' ? 0.1 + Math.random() * 0.2 : 0.2 + Math.random() * 0.5,
      life: 0,
      maxLife: type === 'star' ? 100 + Math.random() * 100 : 400 + Math.random() * 400,
      hue: type === 'dust' ? 40 + Math.random() * 10 : 35 + Math.random() * 15,
      type,
      wobble: Math.random() * Math.PI * 2,
    }
    particles.push(p)
  }

  // Initial batch
  for (let i = 0; i < 30; i++) {
    const p: Particle = {
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: -0.2 - Math.random() * 0.4,
      size: 1 + Math.random() * 2.5,
      alpha: 0.2 + Math.random() * 0.5,
      life: Math.random() * 500,
      maxLife: 400 + Math.random() * 400,
      hue: 35 + Math.random() * 15,
      type: 'firefly',
      wobble: Math.random() * Math.PI * 2,
    }
    particles.push(p)
  }

  // Add some dust
  for (let i = 0; i < 20; i++) {
    spawn('dust')
  }

  let frame = 0
  function loop() {
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Spawn new particles
    if (frame % 8 === 0 && particles.filter(p => p.type === 'firefly').length < 50) spawn('firefly')
    if (frame % 20 === 0 && particles.filter(p => p.type === 'dust').length < 30) spawn('dust')
    if (frame % 120 === 0) spawn('star') // occasional shooting star

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i]
      p.life++
      p.wobble += 0.02

      // Mouse interaction - gentle repulsion
      const dx = p.x - mouseX
      const dy = p.y - mouseY
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 100 && dist > 0) {
        const force = (100 - dist) / 100 * 0.3
        p.vx += (dx / dist) * force
        p.vy += (dy / dist) * force
      }

      // Damping
      p.vx *= 0.99
      p.vy *= 0.99

      if (p.type === 'firefly') {
        p.x += p.vx + Math.sin(p.wobble) * 0.3
        p.y += p.vy
      } else if (p.type === 'dust') {
        p.x += Math.sin(p.wobble) * 0.2
        p.y += Math.cos(p.wobble * 0.7) * 0.1
      } else { // star
        p.x += p.vx
        p.y += p.vy
      }

      const progress = p.life / p.maxLife
      const fade = progress < 0.1 ? progress * 10 : progress > 0.8 ? (1 - progress) * 5 : 1

      ctx.globalAlpha = p.alpha * fade

      if (p.type === 'star') {
        // Shooting star with trail
        const gradient = ctx.createLinearGradient(p.x, p.y, p.x - p.vx * 10, p.y - p.vy * 10)
        gradient.addColorStop(0, `hsl(${p.hue}, 90%, 80%)`)
        gradient.addColorStop(1, 'transparent')
        ctx.strokeStyle = gradient
        ctx.lineWidth = p.size
        ctx.beginPath()
        ctx.moveTo(p.x, p.y)
        ctx.lineTo(p.x - p.vx * 10, p.y - p.vy * 10)
        ctx.stroke()
      } else {
        // Regular particle
        ctx.fillStyle = `hsl(${p.hue}, ${p.type === 'dust' ? 30 : 80}%, ${p.type === 'dust' ? 60 : 70}%)`
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fill()

        // Glow for fireflies
        if (p.type === 'firefly') {
          ctx.globalAlpha = p.alpha * fade * 0.3
          ctx.beginPath()
          ctx.arc(p.x, p.y, p.size * 3, 0, Math.PI * 2)
          ctx.fill()
        }
      }

      if (p.life >= p.maxLife) particles.splice(i, 1)
    }

    ctx.globalAlpha = 1
    frame++
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
.particles-canvas {
  position: fixed;
  inset: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 5;
  opacity: 0.7;
}
</style>
