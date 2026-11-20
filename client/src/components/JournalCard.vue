<template>
  <div class="journal-card" @click="$emit('select', journal.date)">
    <div class="card-top">
      <span class="card-date">{{ journal.date }}</span>
      <span class="card-weather">{{ journal.weather }}</span>
    </div>
    <div class="card-highlight">{{ journal.highlight }}</div>
    <div class="card-mood">
      <span class="mood-emoji">{{ moodEmoji }}</span>
      <span class="mood-text">{{ journal.mood }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ journal: any }>()
defineEmits<{ select: [date: string] }>()

const moodMap: Record<string, string> = {
  cheerful: '☀️', 开朗: '☀️',
  happy: '😊', 开心: '😊',
  calm: '🍃', 平静: '🍃',
  sad: '🌧️', 难过: '🌧️',
  anxious: '😰', 焦虑: '😰',
  nostalgic: '🌙', 怀旧: '🌙',
  grateful: '🙏', 感恩: '🙏',
  tired: '😴', 疲惫: '😴',
  excited: '✨', 兴奋: '✨',
  peaceful: '🕊️', 安宁: '🕊️',
}

const moodEmoji = computed(() => moodMap[props.journal.mood] || '🌤️')
</script>

<style scoped>
.journal-card {
  background: var(--color-surface-1);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  padding: var(--space-4) var(--space-5);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.journal-card:hover {
  border-color: var(--color-accent);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.card-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-3);
}

.card-date {
  font-size: var(--text-small);
  color: var(--color-accent);
  font-weight: 500;
  font-variant-numeric: tabular-nums;
}

.card-weather {
  font-size: var(--text-caption);
  color: var(--color-text-muted);
}

.card-highlight {
  font-size: var(--text-body);
  color: var(--color-text);
  line-height: 1.5;
}

.card-mood {
  display: flex;
  align-items: center;
  gap: var(--space-2);
  margin-top: var(--space-3);
}

.mood-text {
  font-size: var(--text-caption);
  color: var(--color-text-muted);
}
</style>
