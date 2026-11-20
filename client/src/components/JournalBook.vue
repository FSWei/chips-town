<template>
  <Transition name="book-open">
    <div v-if="show" class="book-backdrop" @click.self="$emit('close')">
      <div class="book-container">
        <!-- 书本封面/脊 -->
        <div class="book-spine" />

        <!-- 书页区 -->
        <div class="book-pages">
          <!-- 左页 -->
          <div class="page page-left" :class="{ flip: currentPage > 0 }">
            <div class="page-inner">
              <div class="page-header">
                <span class="page-date">{{ dateDisplay }}</span>
                <span class="page-mood">{{ moodSym }} {{ mood }}</span>
              </div>
              <div class="page-content" v-if="currentPage === 0 && pages[0]">
                <div class="page-period">{{ pages[0].label }}</div>
                <p class="page-activity">{{ pages[0].activity }}</p>
                <div class="page-location" v-if="pages[0].location">{{ pages[0].location }}</div>
                <p class="page-thought">"{{ pages[0].thoughts }}"</p>
              </div>
              <div class="page-content" v-else-if="currentPage === 1 && pages[1]">
                <div class="page-period">{{ pages[1].label }}</div>
                <p class="page-activity">{{ pages[1].activity }}</p>
                <div class="page-location" v-if="pages[1].location">{{ pages[1].location }}</div>
                <p class="page-thought">"{{ pages[1].thoughts }}"</p>
              </div>
              <div class="page-content" v-else-if="currentPage === 2 && pages[2]">
                <div class="page-period">{{ pages[2].label }}</div>
                <p class="page-activity">{{ pages[2].activity }}</p>
                <div class="page-location" v-if="pages[2].location">{{ pages[2].location }}</div>
                <p class="page-thought">"{{ pages[2].thoughts }}"</p>
              </div>
            </div>
            <!-- 翻页阴影 -->
            <div class="page-shadow-left" />
          </div>

          <!-- 右页 -->
          <div class="page page-right">
            <div class="page-inner">
              <div v-if="currentPage < 2" class="page-content">
                <div v-if="currentPage === 0 && pages[1]">
                  <div class="page-period">{{ pages[1].label }}</div>
                  <p class="page-activity">{{ pages[1].activity }}</p>
                  <div class="page-location" v-if="pages[1].location">{{ pages[1].location }}</div>
                  <p class="page-thought">"{{ pages[1].thoughts }}"</p>
                </div>
                <div v-else-if="currentPage === 1 && pages[2]">
                  <div class="page-period">{{ pages[2].label }}</div>
                  <p class="page-activity">{{ pages[2].activity }}</p>
                  <div class="page-location" v-if="pages[2].location">{{ pages[2].location }}</div>
                  <p class="page-thought">"{{ pages[2].thoughts }}"</p>
                </div>
              </div>
              <div v-else-if="currentPage === 2" class="page-content">
                <!-- 最后一页：碎碎念 + 高光 -->
                <div v-if="rambling">
                  <div class="page-period">碎碎念</div>
                  <p class="page-thought page-ramble">"{{ rambling }}"</p>
                </div>
                <div class="page-highlight" v-if="highlight">
                  <span class="highlight-mark">◆</span>
                  {{ highlight }}
                </div>
              </div>
              <!-- 页码 -->
              <div class="page-number">{{ currentPage * 2 + 1 }}-{{ currentPage * 2 + 2 }}</div>
            </div>
            <div class="page-shadow-right" />
          </div>

          <!-- 翻页按钮 -->
          <button class="page-btn page-btn-prev" @click="prevPage" :disabled="currentPage === 0">
            <svg width="16" height="16" viewBox="0 0 16 16"><path d="M11 3L5 8l6 5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>
          </button>
          <button class="page-btn page-btn-next" @click="nextPage" :disabled="currentPage === 2">
            <svg width="16" height="16" viewBox="0 0 16 16"><path d="M5 3l6 5-6 5" stroke="currentColor" stroke-width="1.5" fill="none" stroke-linecap="round"/></svg>
          </button>
        </div>

        <!-- 关闭 -->
        <button class="book-close" @click="$emit('close')">
          <svg width="14" height="14" viewBox="0 0 14 14"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        </button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

const props = defineProps<{
  show: boolean
  date: string
  mood: string
  weather: string
  content: any // parsed journal content
  highlight: string
}>()

defineEmits<{ close: [] }>()

const currentPage = ref(0)

const moodSymMap: Record<string, string> = {
  开朗:'☀',开心:'☺',平静:'～',安宁:'☁',感恩:'☘',
  怀旧:'☽',疲惫:'zZ',焦虑:'…',难过:'☔',兴奋:'★',
}
const moodSym = computed(() => moodSymMap[props.mood] || '·')

const dateDisplay = computed(() => {
  if (!props.date) return ''
  const d = new Date(props.date + 'T00:00:00')
  const w = ['日','一','二','三','四','五','六']
  return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日 星期${w[d.getDay()]}`
})

const pages = computed(() => {
  if (!props.content) return []
  const c = props.content
  return [
    { label: '上午', ...c.morning },
    { label: '下午', ...c.afternoon },
    { label: '晚上', activity: c.evening?.activity, location: c.evening?.location, thoughts: c.evening?.reflections || c.evening?.thoughts },
  ].filter(p => p.activity)
})

const rambling = computed(() => props.content?.rambling || '')

watch(() => props.show, (v) => { if (v) currentPage.value = 0 })

function prevPage() { if (currentPage.value > 0) currentPage.value-- }
function nextPage() { if (currentPage.value < 2) currentPage.value++ }
</script>

<style scoped>
.book-backdrop {
  position: fixed; inset: 0;
  background: rgba(12, 10, 9, 0.6);
  backdrop-filter: blur(6px);
  z-index: 200;
  display: flex; align-items: center; justify-content: center;
}

.book-container {
  position: relative;
  display: flex;
  animation: bookAppear 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
}

@keyframes bookAppear {
  from { transform: scale(0.8) rotateY(-15deg); opacity: 0; }
  to { transform: scale(1) rotateY(0); opacity: 1; }
}

.book-spine {
  width: 12px;
  background: linear-gradient(90deg, #2d2926, #3d3936, #2d2926);
  border-radius: 2px 0 0 2px;
  box-shadow: inset -2px 0 4px rgba(0,0,0,0.3);
}

.book-pages {
  display: flex;
  position: relative;
  perspective: 1200px;
}

/* 页面 */
.page {
  width: 340px;
  height: 480px;
  background: #faf8f2;
  position: relative;
  overflow: hidden;
  transition: transform 0.6s cubic-bezier(0.22, 1, 0.36, 1);
}

.page-left {
  border-radius: 4px 0 0 4px;
  transform-origin: right center;
}

.page-right {
  border-radius: 0 4px 4px 0;
}

.page-inner {
  padding: 28px 24px;
  height: 100%;
  display: flex;
  flex-direction: column;
  position: relative;
}

/* 纸张纹理 */
.page::before {
  content: '';
  position: absolute; inset: 0;
  background:
    repeating-linear-gradient(0deg, transparent, transparent 27px, rgba(0,0,0,0.03) 27px, rgba(0,0,0,0.03) 28px);
  pointer-events: none;
}

/* 页面阴影 */
.page-shadow-left {
  position: absolute; right: 0; top: 0; bottom: 0; width: 30px;
  background: linear-gradient(90deg, transparent, rgba(0,0,0,0.06));
  pointer-events: none;
}
.page-shadow-right {
  position: absolute; left: 0; top: 0; bottom: 0; width: 20px;
  background: linear-gradient(270deg, transparent, rgba(0,0,0,0.04));
  pointer-events: none;
}

/* 页面头部 */
.page-header {
  display: flex; justify-content: space-between; align-items: baseline;
  margin-bottom: 16px; padding-bottom: 8px;
  border-bottom: 1px solid rgba(0,0,0,0.08);
}
.page-date {
  font-family: 'Noto Serif SC', serif;
  font-size: 13px; color: #57534e;
}
.page-mood {
  font-size: 12px; color: #a8a29e;
}

/* 内容 */
.page-content { flex: 1; overflow-y: auto; }
.page-period {
  font-family: 'Noto Serif SC', serif;
  font-size: 14px; font-weight: 600;
  color: #44403c; margin-bottom: 8px;
  letter-spacing: 0.05em;
}
.page-activity {
  font-size: 13px; color: #292524;
  line-height: 1.8; margin: 0 0 8px;
}
.page-location {
  font-size: 11px; color: #a8a29e;
  margin-bottom: 8px;
}
.page-thought {
  font-size: 12px; color: #78716c;
  font-style: italic; line-height: 1.7;
  margin: 0; padding-left: 8px;
  border-left: 2px solid rgba(245,158,11,0.2);
}
.page-ramble {
  border-left-color: rgba(0,0,0,0.06);
  opacity: 0.8;
}
.page-highlight {
  margin-top: 16px; padding-top: 10px;
  border-top: 1px solid rgba(0,0,0,0.06);
  font-size: 12px; color: #b45309;
  font-weight: 500;
}
.highlight-mark {
  color: #f59e0b; font-size: 8px; margin-right: 4px;
}

/* 页码 */
.page-number {
  text-align: center;
  font-size: 10px; color: #a8a29e;
  margin-top: auto; padding-top: 8px;
  font-variant-numeric: tabular-nums;
}

/* 翻页按钮 */
.page-btn {
  position: absolute; top: 50%;
  transform: translateY(-50%);
  width: 32px; height: 48px;
  background: rgba(250, 248, 242, 0.9);
  border: 1px solid rgba(0,0,0,0.08);
  color: #78716c; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
  z-index: 10;
}
.page-btn:hover:not(:disabled) {
  background: #f5f5f4; color: #44403c;
}
.page-btn:disabled { opacity: 0.3; cursor: default; }
.page-btn-prev { left: -40px; border-radius: 4px 0 0 4px; }
.page-btn-next { right: -40px; border-radius: 0 4px 4px 0; }

.book-close {
  position: absolute; top: -36px; right: 0;
  width: 28px; height: 28px; border: none;
  background: rgba(250, 248, 242, 0.2);
  color: rgba(250, 248, 242, 0.6);
  border-radius: 50%; cursor: pointer;
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
.book-close:hover { background: rgba(250, 248, 242, 0.3); color: #faf8f2; }

/* 打开动画 */
.book-enter-active { transition: all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); }
.book-leave-active { transition: all 0.25s ease; }
.book-enter-from { transform: scale(0.8) rotateY(-15deg); opacity: 0; }
.book-leave-to { transform: scale(0.9); opacity: 0; }

/* 滚动条 */
.page-content::-webkit-scrollbar { width: 3px; }
.page-content::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.1); border-radius: 2px; }
</style>
