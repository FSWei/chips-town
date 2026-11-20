<template>
  <div class="npc-detail-page">
    <header class="npc-header">
      <router-link to="/" class="back-link">← 回到小镇</router-link>

      <div class="npc-info" v-if="npc">
        <div class="npc-avatar">
          <span class="avatar-letter">{{ npc.name?.[0] || '?' }}</span>
        </div>
        <div class="npc-meta">
          <h1 class="npc-name">{{ npc.name }}</h1>
          <p class="npc-occupation">{{ npc.occupation }}</p>
        </div>
      </div>
    </header>

    <div class="npc-body" v-if="npc">
      <p class="npc-personality">{{ npc.personality }}</p>

      <section class="journal-section">
        <h2 class="section-title">生活日志</h2>

        <div class="journal-list" v-if="journals.length">
          <JournalCard
            v-for="j in journals"
            :key="j.id"
            :journal="j"
            @select="selectJournal"
          />
        </div>

        <div class="empty-state" v-else-if="!loading">
          <p>还没有日志记录</p>
        </div>
      </section>

      <RelationGraph
        v-if="npc"
        :current-npc-id="npc.id"
        :relationships="relationships"
        :npcs="[]"
      />
    </div>

    <div class="loading-state" v-else-if="loading">
      <div class="loading-spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 日志详情弹窗 -->
    <Transition name="overlay">
      <div v-if="selectedJournal" class="journal-overlay" @click.self="selectedJournal = null">
        <JournalDetail :journal="selectedJournal" @close="selectedJournal = null" />
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useNpcStore } from '@/stores/npc'
import { fetchNpcJournal } from '@/api/client'
import { storeToRefs } from 'pinia'
import JournalCard from '@/components/JournalCard.vue'
import JournalDetail from '@/components/JournalDetail.vue'
import RelationGraph from '@/components/RelationGraph.vue'

const route = useRoute()
const store = useNpcStore()
const { currentNpc: npc, journals, relationships, loading } = storeToRefs(store)
const selectedJournal = ref<any>(null)

async function loadData(id: string) {
  await Promise.all([store.loadNpc(id), store.loadJournals(id), store.loadRelationships()])
}

onMounted(() => {
  loadData(route.params.id as string)
})

// watch route params for same-route navigation
watch(() => route.params.id, (newId) => {
  if (newId) loadData(newId as string)
})

async function selectJournal(date: string) {
  const id = route.params.id as string
  selectedJournal.value = await fetchNpcJournal(id, date)
}
</script>

<style scoped>
.npc-detail-page {
  max-width: 720px;
  margin: 0 auto;
  padding: var(--space-6) var(--space-4);
  min-height: 100dvh;
}

/* Header */
.back-link {
  display: inline-block;
  font-size: var(--text-small);
  color: var(--color-text-muted);
  margin-bottom: var(--space-6);
  transition: color var(--transition-fast);
}

.back-link:hover {
  color: var(--color-accent);
}

.npc-info {
  display: flex;
  align-items: center;
  gap: var(--space-5);
  margin-bottom: var(--space-6);
}

.npc-avatar {
  width: var(--avatar-size-lg);
  height: var(--avatar-size-lg);
  background: var(--color-surface-2);
  border: 2px solid var(--color-accent);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.avatar-letter {
  font-size: 36px;
  font-weight: 700;
  color: var(--color-accent);
}

.npc-name {
  font-size: var(--text-title);
  font-weight: 700;
  color: var(--color-text);
  line-height: 1.1;
}

.npc-occupation {
  font-size: var(--text-body);
  color: var(--color-text-secondary);
  margin-top: var(--space-2);
}

/* Personality */
.npc-personality {
  font-size: var(--text-body);
  color: var(--color-text-secondary);
  line-height: 1.7;
  margin-bottom: var(--space-8);
  padding: var(--space-5);
  background: var(--color-surface-0);
  border-radius: var(--radius-md);
  border-left: 3px solid var(--color-accent-dim);
}

/* Journals */
.section-title {
  font-size: var(--text-heading);
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: var(--space-5);
}

.journal-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-4);
}

.empty-state {
  text-align: center;
  padding: var(--space-12) var(--space-4);
  color: var(--color-text-muted);
}

/* Loading */
.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--space-16);
  color: var(--color-text-muted);
  gap: var(--space-4);
}

.loading-spinner {
  width: 24px;
  height: 24px;
  border: 2px solid var(--color-border);
  border-top-color: var(--color-accent);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Overlay */
.journal-overlay {
  position: fixed;
  inset: 0;
  background: hsl(0 0% 0% / 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: var(--z-modal);
  padding: var(--space-4);
}

.overlay-enter-active,
.overlay-leave-active {
  transition: opacity var(--duration-normal) var(--ease-out);
}

.overlay-enter-from,
.overlay-leave-to {
  opacity: 0;
}
</style>
