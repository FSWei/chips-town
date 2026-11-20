<template>
  <div class="journal-detail" v-if="journal">
    <div class="detail-header">
      <div class="detail-meta">
        <span class="detail-date">{{ journal.date }}</span>
        <span class="detail-mood">{{ moodEmoji }}</span>
        <span class="detail-weather">{{ journal.weather }}</span>
      </div>
      <button class="close-btn" @click="$emit('close')">✕</button>
    </div>

    <div class="detail-content">
      <div v-if="data.morning" class="time-block">
        <div class="time-label">早晨</div>
        <div class="time-location">{{ data.morning.location }}</div>
        <p class="time-activity">{{ data.morning.activity }}</p>
        <p class="time-thoughts" v-if="data.morning.thoughts">{{ data.morning.thoughts }}</p>
      </div>

      <div v-if="data.afternoon" class="time-block">
        <div class="time-label">下午</div>
        <div class="time-location">{{ data.afternoon.location }}</div>
        <p class="time-activity">{{ data.afternoon.activity }}</p>
        <p class="time-thoughts" v-if="data.afternoon.thoughts">{{ data.afternoon.thoughts }}</p>
      </div>

      <div v-if="data.evening" class="time-block">
        <div class="time-label">傍晚</div>
        <div class="time-location">{{ data.evening.location }}</div>
        <p class="time-activity">{{ data.evening.activity }}</p>
        <p class="time-thoughts" v-if="data.evening.reflections">{{ data.evening.reflections }}</p>
      </div>

      <div v-if="data.highlight" class="highlight-block">
        {{ data.highlight }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ journal: any }>()
defineEmits<{ close: [] }>()

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

const moodEmoji = computed(() => moodMap[props.journal?.mood] || '🌤️')

const data = computed(() => {
  try {
    return JSON.parse(props.journal?.content || '{}')
  } catch {
    return {}
  }
})
</script>

<style scoped>
.journal-detail {
  background: var(--color-surface-1);
  border: 1px solid var(--color-accent);
  border-radius: var(--radius-lg);
  padding: var(--space-6);
  max-width: 560px;
  width: 100%;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-6);
  padding-bottom: var(--space-4);
  border-bottom: 1px solid var(--color-border-subtle);
}

.detail-meta {
  display: flex;
  gap: var(--space-3);
  align-items: center;
}

.detail-date {
  font-size: var(--text-heading);
  font-weight: 500;
  color: var(--color-accent);
  font-variant-numeric: tabular-nums;
}

.detail-weather {
  font-size: var(--text-small);
  color: var(--color-text-muted);
}

.close-btn {
  background: none;
  border: 1px solid var(--color-border);
  color: var(--color-text-muted);
  width: 32px;
  height: 32px;
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: var(--text-small);
  transition: all var(--transition-fast);
}

.close-btn:hover {
  border-color: var(--color-accent);
  color: var(--color-accent);
}

/* 时间段 */
.time-block {
  margin-bottom: var(--space-6);
}

.time-label {
  font-size: var(--text-small);
  font-weight: 500;
  color: var(--color-accent);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: var(--space-1);
}

.time-location {
  font-size: var(--text-caption);
  color: var(--color-text-muted);
  margin-bottom: var(--space-2);
}

.time-activity {
  font-size: var(--text-body);
  color: var(--color-text);
  line-height: 1.8;
}

.time-thoughts {
  font-size: var(--text-small);
  color: var(--color-text-secondary);
  font-style: italic;
  margin-top: var(--space-2);
  line-height: 1.6;
}

/* 亮点 */
.highlight-block {
  margin-top: var(--space-6);
  padding: var(--space-4) var(--space-5);
  background: var(--color-accent-dim);
  border-radius: var(--radius-md);
  color: var(--color-accent);
  font-size: var(--text-body);
  line-height: 1.6;
  border-left: 3px solid var(--color-accent);
}
</style>
