<template>
  <div class="sb-wrap" :class="{ open }">
    <button class="sb-trigger" @click="open = !open">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path v-if="open" d="M7 1L3 5l4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <path v-else d="M3 1l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    </button>
    <aside class="sb-panel" v-show="open">
      <div class="sb-head">
        <span class="sb-title">小镇居民</span>
        <span class="sb-count">{{ filtered.length }}</span>
      </div>
      <div class="sb-search">
        <input v-model="query" type="text" placeholder="搜索…" class="sb-input" />
      </div>
      <div class="sb-list" ref="listRef">
        <div
          v-for="npc in filtered" :key="npc.id"
          class="sb-card" :class="{ sel: selected === npc.id }"
          @click="pick(npc)"
        >
          <div class="card-avatar">{{ npc.name[0] }}</div>
          <div class="card-body">
            <div class="card-name">{{ npc.nickname || npc.name }}</div>
            <div class="card-sub">{{ npc.occupation }}</div>
          </div>
          <div class="card-arrow">›</div>
        </div>
        <div v-if="!filtered.length" class="sb-empty">无匹配</div>
      </div>
    </aside>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { autoAnimate } from '@formkit/auto-animate'
import { ALL_NPCS } from '@/data/npcLoader'

const emit = defineEmits<{ select: [id: string, name: string, activity: string] }>()
const open = ref(false)
const selected = ref('')
const query = ref('')
const listRef = ref<HTMLElement>()

const npcs = ALL_NPCS.map(n => ({
  id: n.id, name: n.name, nickname: n.nickname, occupation: n.occupation || '',
}))

const filtered = computed(() => {
  if (!query.value.trim()) return npcs
  const q = query.value.trim().toLowerCase()
  return npcs.filter(n =>
    n.name.toLowerCase().includes(q) || (n.nickname || '').toLowerCase().includes(q) || n.occupation.toLowerCase().includes(q)
  )
})

function pick(npc: typeof npcs[0]) { selected.value = npc.id; emit('select', npc.id, npc.name, '') }

onMounted(() => { if (listRef.value) autoAnimate(listRef.value) })
</script>

<style scoped>
.sb-wrap { position: fixed; top: 0; left: 0; bottom: 0; z-index: 60; display: flex; pointer-events: none; }
.sb-trigger {
  pointer-events: auto; align-self: center;
  width: 24px; height: 56px;
  background: var(--ink-900); border: 1px solid var(--glass-border); border-left: none;
  border-radius: 0 var(--radius-sm) var(--radius-sm) 0;
  color: var(--ink-600); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.sb-trigger:hover {
  background: var(--ink-800);
  color: var(--gold-400);
  border-color: var(--border-accent);
  width: 28px;
  box-shadow: 2px 0 12px var(--gold-glow);
}
.sb-trigger:active { transform: scale(0.95); }
.sb-wrap.open .sb-trigger { border-radius: 0; }

.sb-panel {
  pointer-events: auto; width: 220px; height: 100vh;
  background: var(--ink-900);
  border-right: 1px solid var(--glass-border);
  display: flex; flex-direction: column; overflow: hidden;
  animation: panelSlideIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}
@keyframes panelSlideIn {
  from { transform: translateX(-100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
.sb-head { padding: 12px 14px 6px; display: flex; align-items: baseline; gap: 6px; flex-shrink: 0; }
.sb-title { font-family: var(--font-display); font-size: var(--text-small); font-weight: 600; color: var(--ink-500); letter-spacing: 0.06em; }
.sb-count { font-size: 11px; color: var(--ink-600); font-variant-numeric: tabular-nums; }
.sb-search { padding: 4px 10px 6px; flex-shrink: 0; }
.sb-input {
  width: 100%; padding: 5px 8px;
  background: var(--ink-800); border: 1px solid var(--ink-700);
  border-radius: var(--radius-sm); color: var(--ink-200);
  font-size: 12px; font-family: inherit; outline: none;
  transition: all var(--transition-fast);
}
.sb-input::placeholder { color: var(--ink-600); }
.sb-input:focus {
  border-color: var(--gold-500);
  box-shadow: 0 0 0 2px var(--gold-glow), 0 0 12px rgba(245,158,11,0.1);
}
.sb-list { flex: 1; overflow-y: auto; padding: 2px 8px 8px; }

.sb-card {
  display: flex; align-items: center; gap: 9px;
  padding: 7px 8px; border-radius: var(--radius-sm);
  cursor: pointer; transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1); margin-bottom: 2px;
  position: relative; overflow: hidden;
}
.sb-card::before {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(135deg, var(--gold-glow), transparent);
  opacity: 0; transition: opacity 0.2s;
}
.sb-card:hover {
  background: var(--ink-800);
  transform: translateX(4px);
  box-shadow: -2px 0 0 var(--gold-500);
}
.sb-card:hover::before { opacity: 1; }
.sb-card:active { transform: translateX(2px) scale(0.98); }
.sb-card.sel {
  background: var(--gold-glow);
  box-shadow: -2px 0 0 var(--gold-500), inset 0 0 12px rgba(245,158,11,0.08);
}
.sb-card.sel::before { opacity: 1; }

.card-avatar {
  width: 28px; height: 28px; flex-shrink: 0;
  border-radius: var(--radius-sm);
  background: var(--ink-800); border: 1px solid var(--ink-700);
  display: flex; align-items: center; justify-content: center;
  font-family: var(--font-display); font-size: 12px; font-weight: 600;
  color: var(--gold-500); opacity: 0.5;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  position: relative; z-index: 1;
}
.sb-card:hover .card-avatar {
  opacity: 1; transform: scale(1.1);
  border-color: var(--gold-500); box-shadow: 0 0 8px var(--gold-glow);
}
.sb-card.sel .card-avatar { opacity: 1; border-color: var(--gold-500); box-shadow: 0 0 8px var(--gold-glow); }
.card-body { min-width: 0; position: relative; z-index: 1; flex: 1; }
.card-name { font-size: var(--text-small); color: var(--ink-200); font-weight: 500; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.card-sub { font-size: 11px; color: var(--ink-600); }
.card-arrow {
  color: var(--ink-600); font-size: 14px; position: relative; z-index: 1;
  transition: all 0.2s; opacity: 0; transform: translateX(-4px);
}
.sb-card:hover .card-arrow { opacity: 1; transform: translateX(0); color: var(--gold-400); }
.sb-empty { padding: 16px; text-align: center; font-size: 12px; color: var(--ink-600); }
</style>
