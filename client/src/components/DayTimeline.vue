<template>
  <div class="tl-wrap" :class="{ open: expanded }">
    <button class="tl-trigger" @click="expanded = !expanded">
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
        <path v-if="expanded" d="M1 3l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        <path v-else d="M1 7l4-4 4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      <span class="tl-label">{{ expanded ? '收起' : '日程总览' }}</span>
    </button>
    <Transition name="tl-slide">
      <div v-show="expanded" class="tl-body">
        <div class="tl-axis">
          <div v-for="h in hours" :key="h" class="tl-tick" :style="{ left: (h / 24 * 100) + '%' }">
            <span class="tick-lbl">{{ fmtH(h) }}</span>
            <span class="tick-line" />
          </div>
          <div class="tl-now" :style="{ left: (currentMinutes / 1440 * 100) + '%' }">
            <span class="now-dot" />
            <span class="now-line" />
            <span class="now-tag">现在</span>
          </div>
        </div>
        <div class="tl-rows">
          <div v-for="(npc, idx) in schedules" :key="npc.id" class="tl-row" :style="{ animationDelay: idx * 30 + 'ms' }">
            <span class="row-name">{{ shortName(npc) }}</span>
            <div class="row-track">
              <div
                v-for="(b, i) in blocks(npc)" :key="i"
                class="row-block" :class="[blockClass(b), { active: isActive(b) }]"
                :style="{ left: (b.s / 1440 * 100) + '%', width: ((b.e - b.s) / 1440 * 100) + '%' }"
                :title="`${fmtM(b.s)}-${fmtM(b.e)}: ${b.a}`"
              >
                <span class="blk-txt" v-if="blkW(b) > 6">{{ b.a }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ALL_NPCS } from '@/data/npcLoader'

const props = defineProps<{ currentMinutes: number }>()
const expanded = ref(false)
const hours = [0, 3, 6, 9, 12, 15, 18, 21]
const schedules = ALL_NPCS

interface Blk { s: number; e: number; a: string }
function shortName(n: any) { return n.nickname || n.name }
function fmtH(h: number) { return `${String(h).padStart(2, '0')}:00` }
function fmtM(m: number) { return `${String(Math.floor(m/60)).padStart(2,'0')}:${String(m%60).padStart(2,'0')}` }
function blocks(npc: any): Blk[] {
  const out: Blk[] = []
  const entries = [...npc.schedule].sort((a: any, b: any) => a.time - b.time)
  for (let i = 0; i < entries.length; i++) out.push({ s: entries[i].time, e: entries[i + 1]?.time ?? 1440, a: entries[i].activity || '休息' })
  return out
}
function blkW(b: Blk) { return (b.e - b.s) / 1440 * 100 }
function isActive(b: Blk) { return props.currentMinutes >= b.s && props.currentMinutes < b.e }
function blockClass(b: Blk): string {
  const a = b.a
  if (/睡|休息|值班/.test(a)) return 'b-rest'
  if (/吃|饭|面|早|午|晚/.test(a)) return 'b-eat'
  if (/玩|跑|跳|遛|广场/.test(a)) return 'b-play'
  if (/工作|上班|巡逻|看病|上课|站|卖|送/.test(a)) return 'b-work'
  return 'b-default'
}
</script>

<style scoped>
.tl-wrap { position: fixed; bottom: 0; left: 0; right: 0; z-index: 50; transition: all 0.3s var(--ease-out); }
.tl-trigger {
  display: flex; align-items: center; gap: 4px;
  margin: 0 auto; padding: 3px 12px;
  background: var(--ink-900); border: 1px solid var(--glass-border); border-bottom: none;
  border-radius: var(--radius-sm) var(--radius-sm) 0 0;
  color: var(--ink-600); font-size: 11px; cursor: pointer;
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.tl-trigger:hover {
  background: var(--ink-800);
  color: var(--gold-400);
  border-color: var(--border-accent);
  padding: 4px 16px;
  box-shadow: 0 -2px 12px var(--gold-glow);
}
.tl-trigger:active { transform: scale(0.95); }
.tl-label { font-size: 11px; }

.tl-body {
  background: var(--ink-900);
  border-top: 1px solid var(--glass-border);
  padding: 12px 48px 14px 44px;
  overflow-x: auto;
}
.tl-slide-enter-active { transition: all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1); }
.tl-slide-leave-active { transition: all 0.25s ease; }
.tl-slide-enter-from, .tl-slide-leave-to { opacity: 0; transform: translateY(20px); }

.tl-axis { position: relative; height: 24px; margin-bottom: 6px; min-width: 480px; }
.tl-tick { position: absolute; top: 0; transform: translateX(-50%); }
.tick-lbl { font-size: 11px; color: var(--ink-500); font-variant-numeric: tabular-nums; display: block; text-align: center; line-height: 1; }
.tick-line { display: block; width: 1px; height: 4px; background: var(--ink-700); margin: 2px auto 0; }

.tl-now { position: absolute; top: 0; bottom: -600px; transform: translateX(-50%); z-index: 5; pointer-events: none; }
.now-dot {
  display: block; width: 8px; height: 8px; border-radius: 50%;
  background: var(--gold-500); margin: -2px auto 0;
  box-shadow: 0 0 8px var(--gold-glow-strong);
  animation: nowPulse 2s ease-in-out infinite;
}
@keyframes nowPulse {
  0%, 100% { box-shadow: 0 0 4px var(--gold-glow); transform: scale(1); }
  50% { box-shadow: 0 0 12px var(--gold-glow-strong); transform: scale(1.2); }
}
.now-line { display: block; width: 1.5px; height: 100%; background: var(--gold-500); opacity: 0.3; margin: 0 auto; }
.now-tag { font-size: 10px; color: var(--gold-400); font-weight: 600; text-align: center; display: block; margin-top: -1px; }

.tl-rows { min-width: 480px; }
.tl-row {
  display: flex; align-items: center; height: 24px; gap: 6px;
  animation: rowSlideIn 0.3s both;
}
@keyframes rowSlideIn {
  from { opacity: 0; transform: translateX(-8px); }
  to { opacity: 1; transform: translateX(0); }
}
.tl-row + .tl-row { margin-top: 2px; }
.row-name { flex-shrink: 0; width: 44px; font-size: 12px; color: var(--ink-500); text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; line-height: 1; }
.row-track { flex: 1; position: relative; height: 20px; background: var(--ink-800); border-radius: 3px; overflow: hidden; }

.row-block {
  position: absolute; top: 1px;
  border-radius: 2px; overflow: hidden;
  height: 18px;
  cursor: default; transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}
.row-block:hover { filter: brightness(1.3); transform: scaleY(1.15); z-index: 2; }
.row-block.active {
  box-shadow: 0 0 8px var(--gold-glow-strong);
  outline: 1px solid rgba(245,158,11,0.3);
  animation: activeBlock 2s ease-in-out infinite;
}
@keyframes activeBlock {
  0%, 100% { outline-color: rgba(245,158,11,0.3); }
  50% { outline-color: rgba(245,158,11,0.6); }
}

.b-rest    { background: var(--ink-800); }
.b-eat     { background: rgba(245, 158, 11, 0.15); }
.b-work    { background: rgba(79, 195, 247, 0.12); }
.b-play    { background: rgba(102, 187, 106, 0.12); }
.b-default { background: var(--ink-700); }

.blk-txt { font-size: 10px; color: var(--ink-500); padding: 0 3px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; line-height: 18px; display: block; }
.row-block.active .blk-txt { color: var(--gold-400); }
</style>
