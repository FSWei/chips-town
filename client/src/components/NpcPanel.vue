<template>
  <Transition name="panel-slide">
    <div v-if="npc" class="panel-backdrop" @click.self="$emit('close')">
      <div class="panel">
        <button class="panel-close" @click="$emit('close')" aria-label="关闭">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
          </svg>
        </button>

        <!-- Hero -->
        <div class="hero">
          <div class="hero-avatar">
            <span class="avatar-letter">{{ npc.name[0] }}</span>
            <div class="avatar-glow" />
          </div>
          <div class="hero-info">
            <div class="hero-name">{{ npc.nickname || npc.name }}</div>
            <div class="hero-meta">
              <span class="hero-occ">{{ npc.occupation || '小镇居民' }}</span>
              <span class="hero-age" v-if="npc.age">{{ npc.age }}岁</span>
            </div>
            <p class="hero-desc" v-if="npc.description">{{ npc.description }}</p>
            <div class="hero-tags" v-if="personalityList.length">
              <span v-for="(t, i) in personalityList" :key="t" class="tag" :style="{ animationDelay: i * 60 + 'ms' }">{{ t }}</span>
            </div>
          </div>
        </div>

        <!-- 状态条 -->
        <div class="status-strip">
          <div class="status-left">
            <span class="pulse-dot" />
            <span class="status-text">{{ npc.currentActivity || '闲逛中' }}</span>
          </div>
          <span class="status-clock">{{ currentTime }}</span>
        </div>

        <!-- 内容 -->
        <div class="content-scroll">
          <div class="content-grid">
            <div class="col-left">
              <section class="block">
                <h3 class="block-title">日程</h3>
                <div class="schedule-list">
                  <div
                    v-for="(entry, i) in npc.schedule" :key="i"
                    class="sched-row" :class="{ now: isCurrentSchedule(entry, i) }"
                  >
                    <span class="sched-time">{{ formatTime(entry.time) }}</span>
                    <span class="sched-pip" :class="{ now: isCurrentSchedule(entry, i) }" />
                    <span class="sched-act">{{ entry.activity }}</span>
                  </div>
                </div>
              </section>
              <section class="block" v-if="relations.length">
                <h3 class="block-title">关系</h3>
                <div class="rel-list">
                  <div v-for="(r, idx) in relations" :key="r.to" class="rel-row" :style="{ animationDelay: idx * 80 + 'ms' }">
                    <span class="rel-name">{{ getNpcName(r.to) }}</span>
                    <span class="rel-label">{{ r.label }}</span>
                    <span class="rel-dots">
                      <span v-for="i in 5" :key="i" class="rel-dot" :class="{ on: i <= r.strength }" :style="{ animationDelay: (idx * 80 + i * 60) + 'ms' }" />
                    </span>
                  </div>
                </div>
              </section>
            </div>

            <div class="col-right">
              <section class="block journal-block">
                <div class="journal-top">
                  <h3 class="block-title">生活日志</h3>
                  <div class="journal-nav" v-if="journalDates.length">
                    <button class="nav-btn" @click="prevJournal" :disabled="!canPrev">
                      <svg width="10" height="10" viewBox="0 0 10 10"><path d="M7 1L3 5l4 4" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>
                    </button>
                    <span class="nav-label">{{ currentDateDisplay }}</span>
                    <button class="nav-btn" @click="nextJournal" :disabled="!canNext">
                      <svg width="10" height="10" viewBox="0 0 10 10"><path d="M3 1l4 4-4 4" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>
                    </button>
                  </div>
                </div>
                <div class="date-strip" v-if="journalDates.length">
                  <button
                    v-for="d in journalDates" :key="d.date"
                    class="date-chip" :class="{ sel: d.date === currentDate }"
                    @click="loadJournal(d.date)"
                  >
                    {{ formatShortDate(d.date) }}
                    <span class="chip-mood">{{ moodSym[d.mood] || '·' }}</span>
                  </button>
                </div>
                <div class="journal-body">
                  <div v-if="journalLoading" class="skeleton-wrap">
                    <div class="skeleton-line w60" />
                    <div class="skeleton-line w100" />
                    <div class="skeleton-line w80" />
                    <div class="skeleton-line w100" />
                    <div class="skeleton-line w40" />
                  </div>
                  <article v-else-if="journal" class="journal-card">
                    <div class="j-meta">
                      <span class="j-mood">{{ moodSym[journal.mood] || '·' }} {{ journal.mood }}</span>
                      <span class="j-weather">{{ journal.weather }}</span>
                    </div>
                    <div v-if="journalData" class="j-sections">
                      <section v-for="(period, key) in journalData" :key="key" class="j-period">
                        <div class="j-period-head">{{ periodLabels[key] || key }}</div>
                        <p class="j-activity">{{ period.activity }}</p>
                        <div class="j-loc" v-if="period.location">{{ period.location }}</div>
                        <p class="j-thought">"{{ period.thoughts || period.reflections }}"</p>
                      </section>
                      <section v-if="journalData.rambling" class="j-period j-ramble">
                        <div class="j-period-head">碎碎念</div>
                        <p class="j-thought">"{{ journalData.rambling }}"</p>
                      </section>
                    </div>
                    <!-- 高亮：打字机效果 -->
                    <div class="j-highlight" v-if="journal.highlight">
                      <span class="highlight-icon">◆</span>
                      <span class="highlight-text" :class="{ typing: isTypingHighlight }">{{ typedHighlight }}</span>
                    </div>

                  </article>
                  <div v-else class="journal-empty">
                    {{ journalDates.length ? '选择一天查看日志' : '暂无日志' }}
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Transition>


</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { getRelationships } from '@/game/relationships'
import { ALL_NPCS } from '@/data/npcLoader'


interface ScheduleEntry { time: number; tileX: number; tileY: number; activity: string }
interface NpcInfo {
  id: string; name: string; nickname?: string; occupation?: string; age?: number
  personality?: string[]; description?: string; currentActivity?: string
  schedule: ScheduleEntry[]; spriteIndex: number
}

const props = defineProps<{ npc: NpcInfo | null; gameTimeMinutes: number }>()
defineEmits<{ close: [] }>()

const journal = ref<any>(null)
const journalData = ref<any>(null)
const journalLoading = ref(false)
const journalDates = ref<{ date: string; mood: string; highlight: string }[]>([])
const currentDate = ref('')


// 打字机效果
const typedHighlight = ref('')
const isTypingHighlight = ref(false)

const periodLabels: Record<string, string> = { morning: '上午', afternoon: '下午', evening: '晚上' }
const moodSym: Record<string, string> = {
  cheerful:'☀',开朗:'☀',happy:'☺',开心:'☺',calm:'～',平静:'～',
  sad:'☔',难过:'☔',anxious:'…',焦虑:'…',nostalgic:'☽',怀旧:'☽',
  grateful:'☘',感恩:'☘',tired:'zZ',疲惫:'zZ',excited:'★',兴奋:'★',
  peaceful:'☁',安宁:'☁',
}

function typewrite(text: string) {
  typedHighlight.value = ''
  isTypingHighlight.value = true
  let i = 0
  const tick = () => {
    if (i < text.length) {
      typedHighlight.value += text[i]
      i++
      setTimeout(tick, 30 + Math.random() * 25)
    } else {
      isTypingHighlight.value = false
    }
  }
  tick()
}

watch(() => props.npc, async (n) => {
  journal.value = null; journalData.value = null; journalDates.value = []; currentDate.value = ''
  typedHighlight.value = ''
  if (!n) return
  try {
    const res = await fetch(`/api/npcs/${n.id}/journals?limit=100`)
    if (res.ok) { const list = await res.json(); journalDates.value = list; if (list.length) loadJournal(list[0].date) }
  } catch {}
}, { immediate: true })

async function loadJournal(date: string) {
  if (!props.npc) return
  currentDate.value = date; journalLoading.value = true; typedHighlight.value = ''
  try {
    const res = await fetch(`/api/npcs/${props.npc.id}/journals/${date}`)
    if (res.ok) {
      const d = await res.json(); journal.value = d; journalData.value = JSON.parse(d.content)
      // 触发打字机
      if (d.highlight) typewrite(d.highlight)
    } else { journal.value = null; journalData.value = null }
  } catch { journal.value = null; journalData.value = null }
  finally { journalLoading.value = false }
}

const idx = computed(() => journalDates.value.findIndex(d => d.date === currentDate.value))
const canPrev = computed(() => idx.value < journalDates.value.length - 1)
const canNext = computed(() => idx.value > 0)
function prevJournal() { if (canPrev.value) loadJournal(journalDates.value[idx.value + 1].date) }
function nextJournal() { if (canNext.value) loadJournal(journalDates.value[idx.value - 1].date) }

const currentDateDisplay = computed(() => {
  if (!currentDate.value) return ''
  const d = new Date(currentDate.value + 'T00:00:00')
  const w = ['日','一','二','三','四','五','六']
  return `${d.getMonth()+1}月${d.getDate()}日 周${w[d.getDay()]}`
})
function formatShortDate(date: string) {
  const d = new Date(date + 'T00:00:00'); return `${d.getMonth()+1}/${d.getDate()}`
}
const currentTime = computed(() => {
  const h = Math.floor(props.gameTimeMinutes / 60) % 24
  const m = Math.floor(props.gameTimeMinutes % 60)
  return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`
})
const relations = computed(() => props.npc ? getRelationships(props.npc.id) : [])
const personalityList = computed(() => {
  const p = props.npc?.personality; if (!p) return []
  return Array.isArray(p) ? p : String(p).split(/[、,，]/).filter(Boolean)
})
function getNpcName(id: string) { return ALL_NPCS.find(n => n.id === id)?.name ?? id }
function formatTime(min: number) { return `${String(Math.floor(min/60)).padStart(2,'0')}:${String(min%60).padStart(2,'0')}` }
function isCurrentSchedule(entry: ScheduleEntry, i: number) {
  if (!props.npc) return false
  const next = props.npc.schedule[i + 1]
  return next ? props.gameTimeMinutes >= entry.time && props.gameTimeMinutes < next.time : props.gameTimeMinutes >= entry.time
}
</script>

<style scoped>
/* ── 面板 ── */
.panel-backdrop {
  position: fixed; inset: 0;
  background: rgba(12, 10, 9, 0.5);
  backdrop-filter: blur(4px);
  z-index: 100;
  display: flex; justify-content: flex-end;
}
.panel {
  width: min(78vw, 960px); min-width: 620px;
  height: 100vh;
  background: var(--ink-900);
  border-left: 1px solid var(--glass-border);
  box-shadow: -12px 0 48px rgba(0,0,0,0.5);
  display: flex; flex-direction: column;
  overflow: hidden; position: relative;
}
.panel-close {
  position: absolute; top: 14px; right: 14px; z-index: 10;
  width: 28px; height: 28px; border: none;
  background: transparent; color: var(--ink-600);
  border-radius: var(--radius-sm); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.panel-close:hover {
  background: var(--ink-800);
  color: var(--gold-400);
  transform: rotate(90deg) scale(1.1);
  box-shadow: 0 0 8px var(--gold-glow);
}
.panel-close:active { transform: rotate(90deg) scale(0.9); }

/* ── Hero ── */
.hero {
  display: flex; gap: 16px;
  padding: 20px 22px 14px;
  border-bottom: 1px solid var(--glass-border);
  flex-shrink: 0;
}
.hero-avatar {
  width: 72px; height: 92px; flex-shrink: 0;
  border-radius: var(--radius-md);
  background: var(--ink-800);
  border: 1px solid var(--glass-border);
  display: flex; align-items: center; justify-content: center;
  position: relative; overflow: hidden;
}
.avatar-letter {
  font-family: var(--font-display);
  font-size: 32px; font-weight: 700;
  color: var(--gold-500); opacity: 0.5;
  position: relative; z-index: 1;
}
.avatar-glow {
  position: absolute; inset: -20%;
  background: radial-gradient(circle, var(--gold-glow-strong) 0%, transparent 70%);
  animation: breathe 4s ease-in-out infinite;
}
@keyframes breathe { 0%,100%{opacity:0.3;transform:scale(0.9)} 50%{opacity:0.8;transform:scale(1.1)} }

.hero-info { flex: 1; min-width: 0; }
.hero-name {
  font-family: var(--font-display);
  font-size: 19px; font-weight: 700;
  color: var(--ink-100);
  letter-spacing: -0.01em; margin-bottom: 2px;
}
.hero-meta { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
.hero-occ { font-size: var(--text-small); color: var(--ink-500); }
.hero-age {
  font-size: var(--text-caption); color: var(--ink-400);
  padding: 1px 6px; background: var(--ink-800);
  border: 1px solid var(--glass-border);
  border-radius: var(--radius-full);
}
.hero-desc {
  font-size: var(--text-small); color: var(--ink-400);
  line-height: 1.65; margin: 0 0 8px; max-width: 500px;
}
.hero-tags { display: flex; flex-wrap: wrap; gap: 4px; }
.tag {
  font-size: 11px; padding: 1px 7px;
  background: var(--gold-glow); border: 1px solid rgba(245,158,11,0.15);
  border-radius: var(--radius-full); color: var(--gold-400); font-weight: 500;
  animation: tagPop 0.3s var(--ease-spring) both;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
  cursor: default;
}
.tag:hover {
  background: var(--gold-glow-strong);
  transform: scale(1.08);
  box-shadow: 0 2px 8px var(--gold-glow);
}
@keyframes tagPop { from{opacity:0;transform:scale(0.8) translateY(4px)} to{opacity:1;transform:scale(1) translateY(0)} }

/* ── 状态条 ── */
.status-strip {
  display: flex; align-items: center; justify-content: space-between;
  padding: 6px 22px; background: var(--ink-900);
  border-bottom: 1px solid var(--glass-border);
  flex-shrink: 0;
}
.status-left { display: flex; align-items: center; gap: 7px; }
.pulse-dot {
  width: 6px; height: 6px; border-radius: 50%;
  background: var(--success);
  box-shadow: 0 0 8px rgba(102, 187, 106, 0.5);
  animation: pulse 3s ease-in-out infinite;
}
@keyframes pulse { 0%,100%{opacity:.4;box-shadow:0 0 4px rgba(102,187,106,0.3)} 50%{opacity:1;box-shadow:0 0 12px rgba(102,187,106,0.6)} }
.status-text { font-size: var(--text-small); color: var(--gold-400); font-weight: 500; }
.status-clock {
  font-size: var(--text-caption); color: var(--ink-600);
  font-variant-numeric: tabular-nums;
}

/* ── 内容区 ── */
.content-scroll { flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden; }
.content-grid { display: grid; grid-template-columns: 230px 1fr; min-height: 100%; }
.col-left { border-right: 1px solid var(--glass-border); padding: 12px 14px; }
.col-right { padding: 12px 16px; }

.block { margin-bottom: 14px; }
.block-title {
  font-family: var(--font-display);
  font-size: 11px; font-weight: 600;
  color: var(--ink-500);
  letter-spacing: 0.1em; margin-bottom: 8px;
  position: relative;
  display: inline-block;
}
.block-title::after {
  content: '';
  position: absolute;
  bottom: -2px;
  left: 0;
  width: 0;
  height: 1px;
  background: var(--gold-500);
  transition: width 0.3s ease;
}
.block:hover .block-title::after {
  width: 100%;
}

/* ── 日程 ── */
.schedule-list { display: flex; flex-direction: column; gap: 1px; }
.sched-row {
  display: flex; align-items: center; gap: 7px;
  padding: 3px 0; font-size: var(--text-small); cursor: default;
  border-radius: 3px; transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.sched-row:hover { transform: translateX(4px); }
.sched-row:hover .sched-act { color: var(--gold-400); }
.sched-row.now {
  background: var(--gold-glow); padding: 3px 6px; margin: 0 -6px;
  border-left: 2px solid var(--gold-500);
}
.sched-time {
  flex-shrink: 0; width: 34px; text-align: right;
  font-size: 11px; color: var(--ink-600);
  font-variant-numeric: tabular-nums;
}
.sched-pip {
  flex-shrink: 0; width: 5px; height: 5px;
  border-radius: 50%; background: var(--ink-700);
  transition: all var(--transition-fast);
}
.sched-pip.now {
  background: var(--gold-500);
  box-shadow: 0 0 8px var(--gold-glow-strong);
}
.sched-act { color: var(--ink-400); }
.sched-row.now .sched-act { color: var(--gold-400); font-weight: 600; }

/* ── 关系 ── */
.rel-list { display: flex; flex-direction: column; gap: 4px; }
.rel-row {
  display: flex; align-items: center; gap: 6px; font-size: 11px; padding: 3px 0;
  animation: relSlideIn 0.3s both;
  transition: all 0.2s ease;
}
.rel-row:hover { transform: translateX(4px); }
.rel-row:hover .rel-name { color: var(--gold-300); }
@keyframes relSlideIn {
  from { opacity: 0; transform: translateX(-8px); }
  to { opacity: 1; transform: translateX(0); }
}
.rel-name { color: var(--gold-400); font-weight: 500; flex-shrink: 0; }
.rel-label {
  color: var(--ink-600); flex: 1; min-width: 0;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.rel-dots { display: flex; gap: 2px; flex-shrink: 0; }
.rel-dot {
  width: 5px; height: 5px; border-radius: 50%; background: var(--ink-700);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  animation: dotPop 0.3s both;
}
.rel-dot.on {
  background: var(--gold-500);
  box-shadow: 0 0 4px var(--gold-glow);
}
@keyframes dotPop {
  from { transform: scale(0); }
  to { transform: scale(1); }
}

/* ── 日志 ── */
.journal-block { display: flex; flex-direction: column; flex: 1; min-height: 0; margin-bottom: 0; }
.journal-top {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 8px; flex-shrink: 0;
}
.journal-top .block-title { margin-bottom: 0; }
.journal-nav { display: flex; align-items: center; gap: 6px; }
.nav-btn {
  width: 24px; height: 24px;
  border: 1px solid var(--ink-700); background: transparent;
  color: var(--ink-500); border-radius: var(--radius-sm); cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.nav-btn:hover:not(:disabled) {
  background: var(--ink-800);
  color: var(--gold-400);
  border-color: var(--border-accent);
  transform: scale(1.1);
  box-shadow: 0 0 8px var(--gold-glow);
}
.nav-btn:active:not(:disabled) { transform: scale(0.9); }
.nav-btn:disabled { opacity: 0.2; cursor: default; }
.nav-label {
  font-size: var(--text-small); color: var(--gold-400);
  font-weight: 500; min-width: 90px; text-align: center;
  font-variant-numeric: tabular-nums;
}

.date-strip {
  display: flex; gap: 3px; flex-wrap: wrap;
  margin-bottom: 8px; flex-shrink: 0; max-height: 52px; overflow-y: auto;
}
.date-chip {
  font-size: 11px; padding: 2px 7px;
  background: transparent; border: 1px solid var(--ink-700);
  border-radius: var(--radius-full); cursor: pointer;
  color: var(--ink-500); font-family: inherit;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
  display: inline-flex; align-items: center; gap: 3px;
}
.date-chip:hover { background: var(--ink-800); border-color: var(--ink-600); transform: scale(1.05); }
.date-chip.sel { background: var(--gold-glow); border-color: var(--border-accent); color: var(--gold-400); }
.chip-mood { font-size: 9px; }

.journal-body { flex: 1; min-height: 0; overflow-y: auto; }
.journal-card {
  background: var(--ink-900);
  border-radius: var(--radius-md);
  padding: 12px 14px;
  border: 1px solid var(--glass-border);
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  animation: cardFadeIn 0.4s both;
}
.journal-card:hover {
  border-color: var(--border-accent);
  box-shadow: 0 4px 20px rgba(245,158,11,0.08);
}
@keyframes cardFadeIn {
  from { opacity: 0; transform: translateY(12px) scale(0.98); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.j-meta {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 10px; font-size: 11px;
}
.j-mood { color: var(--gold-400); font-weight: 500; }
.j-weather { color: var(--ink-600); }
.j-sections { display: flex; flex-direction: column; gap: 10px; }
.j-period {
  padding-left: 10px; border-left: 2px solid var(--ink-700);
  margin-bottom: 8px; transition: all 0.2s ease;
  animation: periodIn 0.3s both;
}
.j-period:hover {
  border-left-color: var(--gold-500);
  padding-left: 12px;
}
.j-ramble { border-left-color: var(--ink-800); opacity: 0.8; }
.j-ramble:hover { border-left-color: var(--ink-600); }
@keyframes periodIn {
  from { opacity: 0; transform: translateX(-8px); }
  to { opacity: 1; transform: translateX(0); }
}
.j-period-head {
  font-size: 11px; font-weight: 600;
  color: var(--ink-500); margin-bottom: 2px; letter-spacing: 0.04em;
  transition: color 0.2s ease;
}
.j-period:hover .j-period-head {
  color: var(--gold-400);
}
.j-activity { font-size: var(--text-small); color: var(--ink-200); line-height: 1.7; margin: 0 0 2px; }
.j-loc { font-size: 11px; color: var(--ink-600); opacity: 0.6; margin-bottom: 2px; }
.j-thought { font-size: 11px; color: var(--ink-500); font-style: italic; line-height: 1.7; margin: 0; }

/* 高亮打字机 */
.j-highlight {
  margin-top: 10px; padding: 8px 10px;
  border-top: 1px solid var(--glass-border);
  font-size: 11px; color: var(--gold-400); font-weight: 500;
  display: flex; align-items: baseline; gap: 6px;
  animation: highlightIn 0.4s 0.2s both;
  position: relative;
}
.j-highlight::before {
  content: '';
  position: absolute;
  left: 0; top: 0; bottom: 0;
  width: 2px;
  background: var(--gold-500);
  border-radius: 1px;
}
@keyframes highlightIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
.highlight-icon {
  color: var(--gold-500); font-size: 8px; flex-shrink: 0;
  animation: iconPulse 2s ease-in-out infinite;
}
@keyframes iconPulse {
  0%, 100% { opacity: 0.6; }
  50% { opacity: 1; }
}
.highlight-text { flex: 1; }
.highlight-text.typing::after {
  content: '▎';
  animation: blink 0.6s step-end infinite;
  color: var(--gold-400);
}
@keyframes blink { 50%{opacity:0} }



.journal-empty {
  padding: 20px; text-align: center;
  font-size: var(--text-small); color: var(--ink-600);
  background: var(--ink-900); border-radius: var(--radius-md);
  border: 1px dashed var(--ink-700);
}
/* ── 骨架屏加载 ── */
.skeleton-wrap {
  padding: 12px 14px; background: var(--ink-900);
  border-radius: var(--radius-md); border: 1px solid var(--glass-border);
}
.skeleton-line {
  height: 12px; border-radius: 4px; margin-bottom: 10px;
  background: linear-gradient(90deg, var(--ink-800) 25%, var(--ink-700) 50%, var(--ink-800) 75%);
  background-size: 200% 100%;
  animation: shimmer 1.5s ease-in-out infinite;
}
.skeleton-line.w60 { width: 60%; }
.skeleton-line.w100 { width: 100%; }
.skeleton-line.w80 { width: 80%; }
.skeleton-line.w40 { width: 40%; }
@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}


/* ── 面板过渡 ── */
.panel-slide-enter-active, .panel-slide-leave-active {
  transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
.panel-slide-enter-active .panel, .panel-slide-leave-active .panel {
  transition: transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.panel-slide-enter-from, .panel-slide-leave-to {
  background: rgba(12,10,9,0);
  backdrop-filter: blur(0);
}
.panel-slide-enter-from .panel, .panel-slide-leave-to .panel {
  transform: translateX(100%);
}

/* ── 内容交错入场 ── */
.panel-slide-enter-active .hero { animation: heroIn 0.5s 0.1s both cubic-bezier(0.34, 1.56, 0.64, 1); }
.panel-slide-enter-active .status-strip { animation: fadeSlideUp 0.4s 0.2s both; }
.panel-slide-enter-active .content-scroll { animation: fadeSlideUp 0.4s 0.3s both; }
@keyframes heroIn {
  from { opacity: 0; transform: translateY(20px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
</style>
