<template>
  <div class="relation-section" v-if="relatedNpcs.length">
    <h3 class="section-title">社交关系</h3>
    <div class="relation-list">
      <div
        v-for="rel in relatedNpcs"
        :key="rel.npcId"
        class="relation-item"
        @click="$router.push(`/npc/${rel.npcId}`)"
      >
        <div class="rel-avatar">
          <span>{{ rel.name[0] }}</span>
        </div>
        <div class="rel-info">
          <span class="rel-name">{{ rel.name }}</span>
          <span class="rel-type">{{ rel.type }}</span>
        </div>
        <div class="rel-strength">
          <div class="strength-bar">
            <div class="strength-fill" :style="{ width: `${rel.strength * 100}%` }"></div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  currentNpcId: string
  relationships: any[]
  npcs: any[]
}>()

const relatedNpcs = computed(() => {
  const result: any[] = []
  for (const rel of props.relationships) {
    let otherId: string | null = null
    let otherName: string | null = null

    if (rel.npc_a_id === props.currentNpcId) {
      otherId = rel.npc_b_id
      otherName = rel.npc_b_name
    } else if (rel.npc_b_id === props.currentNpcId) {
      otherId = rel.npc_a_id
      otherName = rel.npc_a_name
    }

    if (otherId) {
      result.push({
        npcId: otherId,
        name: otherName || otherId,
        type: rel.type,
        description: rel.description,
        strength: rel.strength,
      })
    }
  }
  return result
})
</script>

<style scoped>
.relation-section {
  margin-top: var(--space-8);
}

.section-title {
  font-size: var(--text-heading);
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: var(--space-5);
}

.relation-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-3);
}

.relation-item {
  display: flex;
  align-items: center;
  gap: var(--space-4);
  padding: var(--space-3) var(--space-4);
  background: var(--color-surface-0);
  border: 1px solid var(--color-border-subtle);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: all var(--transition-fast);
}

.relation-item:hover {
  border-color: var(--color-accent);
  background: var(--color-surface-1);
}

.rel-avatar {
  width: 36px;
  height: 36px;
  background: var(--color-surface-2);
  border: 1px solid var(--color-border);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-accent);
  flex-shrink: 0;
}

.rel-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.rel-name {
  font-size: var(--text-body);
  color: var(--color-text);
  font-weight: 500;
}

.rel-type {
  font-size: var(--text-caption);
  color: var(--color-text-muted);
}

.rel-strength {
  width: 60px;
  flex-shrink: 0;
}

.strength-bar {
  height: 4px;
  background: var(--color-surface-3);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.strength-fill {
  height: 100%;
  background: var(--color-accent);
  border-radius: var(--radius-full);
  transition: width var(--duration-slow) var(--ease-out);
}
</style>
