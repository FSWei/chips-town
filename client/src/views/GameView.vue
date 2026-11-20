<template>
  <div class="game-page">
    <GameCanvas />
  </div>
</template>

<script setup lang="ts">
import GameCanvas from '@/components/GameCanvas.vue'
</script>

<style scoped>
.game-page {
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}
</style>
