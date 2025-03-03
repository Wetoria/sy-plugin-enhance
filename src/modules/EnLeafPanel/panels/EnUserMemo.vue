<template>
  <div class="en-user-memo" :class="{ 'en-user-memo--wide': isWideLayout }" ref="containerRef">
    <!-- 宽屏布局 -->
    <div v-if="isWideLayout" class="en-user-memo-wide-layout">
      <div class="memo-main-area">
        <div class="memo-input-container">
          <MemoInput
            :is-editing="isEditing"
            :editing-block-id="editingBlockId"
            :editing-memo="editingMemo"
            @submit="addMemo"
            @cancel="cancelEdit"
          />
        </div>
        <div class="memo-timeline-area">
          <div class="timeline-content">
            <MemoTimeline
              :memos="filteredMemos"
              @edit="editMemo"
              @delete="deleteMemo"
            />
          </div>
        </div>
      </div>
      
      <div class="memo-side-area">
        <div class="memo-calendar-container">
          <MemoCalendar
            v-model="selectedDates"
            :memos="memos"
            @date-select="handleDateSelect"
          />
        </div>
        <div class="memo-filter-container">
          <MemoFilter
            v-model="activeFilter"
            :is-vertical="true"
            @dailyNoteInfo="handleDailyNoteInfo"
          />
        </div>
        
        <!-- 调试按钮 -->
        <div class="debug-panel" v-if="isDev">
          <div class="debug-info">
            <div>容器宽度: {{ containerRef?.clientWidth || 0 }}px</div>
            <div>布局模式: {{ isWideLayout ? '宽屏' : '窄屏' }}</div>
          </div>
          <button class="debug-btn" @click="updateLayoutMode">刷新布局</button>
        </div>
      </div>
    </div>
    
    <!-- 窄屏布局 -->
    <div v-else class="en-user-memo-narrow-layout">
      <div class="memo-top-area">
        <div
          ref="contentWrapperRef"
          class="memo-content-wrapper"
          :style="{ transform: `translateX(${translateX}%)` }"
          @mousedown="startDrag"
          @mousemove="onDrag"
          @mouseup="endDrag"
          @mouseleave="endDrag"
        >
          <div class="memo-calendar-area">
            <MemoCalendar
              v-model="selectedDates"
              :memos="memos"
              @date-select="handleDateSelect"
            />
          </div>
          <div class="memo-input-area">
            <MemoInput
              :is-editing="isEditing"
              :editing-block-id="editingBlockId"
              :editing-memo="editingMemo"
              @submit="addMemo"
              @cancel="cancelEdit"
            />
          </div>
        </div>
        <div class="memo-dots">
          <div
            class="dot"
            :class="{ active: activeTab === 'calendar' }"
            @click="switchTab('calendar')"
          ></div>
          <div
            class="dot"
            :class="{ active: activeTab === 'input' }"
            @click="switchTab('input')"
          ></div>
        </div>
      </div>
      
      <div class="memo-filter-container">
        <MemoFilter
          v-model="activeFilter"
          @dailyNoteInfo="handleDailyNoteInfo"
        />
      </div>
      
      <div class="memo-timeline-area">
        <div class="timeline-content">
          <MemoTimeline
            :memos="filteredMemos"
            @edit="editMemo"
            @delete="deleteMemo"
          />
        </div>
      </div>
      
      <!-- 调试按钮 -->
      <div class="debug-panel" v-if="isDev">
        <div class="debug-info">
          <div>容器宽度: {{ containerRef?.clientWidth || 0 }}px</div>
          <div>布局模式: {{ isWideLayout ? '宽屏' : '窄屏' }}</div>
          <div>当前标签页: {{ activeTab }}</div>
          <div>滑动位置: {{ translateX }}</div>
        </div>
        <button class="debug-btn" @click="updateLayoutMode">刷新布局</button>
        <button class="debug-btn" @click="switchTab('calendar')">切换到日历</button>
        <button class="debug-btn" @click="switchTab('input')">切换到输入框</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FilterType } from './components/MemoFilter.vue'
import type { Memo } from './components/MemoTimeline.vue'
import { addCommand } from '@/utils/Commands'
import { EN_EVENT_BUS_KEYS } from '@/utils/Constants'
import { enEventBus } from '@/utils/EnEventBus'
import { useSiyuanEventTransactions } from '@/utils/EventBusHooks'
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  nextTick,
} from 'vue'
import MemoCalendar from './components/MemoCalendar.vue'
import MemoFilter from './components/MemoFilter.vue'
import MemoInput from './components/MemoInput.vue'
import MemoTimeline from './components/MemoTimeline.vue'

// 开发环境标志
const isDev = import.meta.env.DEV || false

// 状态
const memos = ref<Memo[]>([])
const isEditing = ref(false)
const editingIndex = ref(-1)
const selectedDates = ref<string[]>([])
const activeFilter = ref<FilterType>('daily')
const activeTab = ref<'calendar' | 'input'>('calendar')

// 响应式布局状态
const isWideLayout = ref(false)
const WIDE_LAYOUT_BREAKPOINT = 768 // 宽度大于768px时启用宽屏布局
const containerRef = ref<HTMLElement | null>(null)

const editingBlockId = computed(() => {
  if (isEditing.value && editingIndex.value !== -1) {
    return memos.value[editingIndex.value].blockId
  }
  return ''
})

const editingMemo = computed(() => {
  if (isEditing.value && editingIndex.value !== -1) {
    return memos.value[editingIndex.value]
  }
  return undefined
})

// 添加滑动相关的状态
const translateX = ref(0)
const isDragging = ref(false)
const startX = ref(0)
const startTranslateX = ref(0)
const containerWidth = ref(0)
const contentWrapperRef = ref<HTMLElement | null>(null)

// 初始化容器宽度
const initContainerWidth = () => {
  if (contentWrapperRef.value) {
    containerWidth.value = contentWrapperRef.value.clientWidth / 2
  }
}

// 检查并更新布局模式
const updateLayoutMode = () => {
  if (containerRef.value) {
    // 使用容器宽度而不是窗口宽度，这样在不同的面板大小下都能正确响应
    const containerWidth = containerRef.value.clientWidth
    const newIsWideLayout = containerWidth > WIDE_LAYOUT_BREAKPOINT
    
    // 只有在布局模式发生变化时才打印日志
    if (isWideLayout.value !== newIsWideLayout) {
      console.log('布局模式变化 - 容器宽度:', containerWidth, '是否宽屏布局:', newIsWideLayout)
      
      // 如果从宽屏切换到窄屏，确保滑动状态正确
      if (!newIsWideLayout) {
        // 在下一个tick中初始化滑动容器宽度
        nextTick(() => {
          initContainerWidth()
          // 根据当前活动标签页设置滑动位置
          translateX.value = activeTab.value === 'calendar' ? 0 : -50
        })
      }
    }
    
    isWideLayout.value = newIsWideLayout
  }
}

// 切换标签页
const switchTab = (tab: 'calendar' | 'input') => {
  activeTab.value = tab
  // 确保容器宽度已初始化
  if (!containerWidth.value && contentWrapperRef.value) {
    containerWidth.value = contentWrapperRef.value.clientWidth / 2
  }
  // 使用50%作为偏移单位，因为每个面板宽度是50%
  translateX.value = tab === 'calendar' ? 0 : -50
  console.log('切换标签页:', tab, '滑动位置:', translateX.value)
}

// 开始拖动
const startDrag = (e: MouseEvent) => {
  isDragging.value = true
  startX.value = e.clientX
  startTranslateX.value = translateX.value
  // 获取容器宽度
  initContainerWidth()
}

// 拖动中
const onDrag = (e: MouseEvent) => {
  if (!isDragging.value) return

  const deltaX = e.clientX - startX.value
  // 将像素差转换为百分比
  const percentageDelta = (deltaX / containerWidth.value) * 50
  let newTranslateX = startTranslateX.value + percentageDelta

  // 限制拖动范围
  newTranslateX = Math.max(-50, Math.min(0, newTranslateX))
  translateX.value = newTranslateX
}

// 结束拖动
const endDrag = () => {
  if (!isDragging.value) return
  isDragging.value = false

  // 根据拖动距离决定切换到哪个标签页
  if (Math.abs(translateX.value) > 25) {
    switchTab('input')
  } else {
    switchTab('calendar')
  }
}

// 从块 ID 中获取时间
function getTimeFromBlockId(blockId: string): string {
  if (!blockId) return ''

  try {
    // 如果是白板ID（以en-whiteboard-id开头）
    if (blockId.startsWith('en-whiteboard-id')) {
      // 白板ID格式：en-whiteboard-id-20250121230346-5c2311bf
      const parts = blockId.split('-')
      if (parts.length >= 4) {
        const timeStr = parts[3] // 获取时间部分
        const year = timeStr.slice(0, 4)
        const month = timeStr.slice(4, 6)
        const day = timeStr.slice(6, 8)
        const hour = timeStr.slice(8, 10)
        const minute = timeStr.slice(10, 12)
        const second = timeStr.slice(12, 14)
        return `${year}-${month}-${day} ${hour}:${minute}:${second}`
      }
      return ''
    }

    // 普通块ID的处理
    const timeStr = blockId.split('-')[0]
    const year = timeStr.slice(0, 4)
    const month = timeStr.slice(4, 6)
    const day = timeStr.slice(6, 8)
    const hour = timeStr.slice(8, 10)
    const minute = timeStr.slice(10, 12)
    const second = timeStr.slice(12, 14)
    return `${year}-${month}-${day} ${hour}:${minute}:${second}`
  } catch (err) {
    console.error('Error parsing block ID:', err)
    return ''
  }
}

// 根据选中的日期过滤备忘录
const filteredMemos = computed(() => {
  let filtered = memos.value

  // 按日期筛选
  if (selectedDates.value.length > 0) {
    filtered = filtered.filter((memo) => {
      try {
        const memoDate = memo.time.split(' ')[0] // 只取日期部分
        return selectedDates.value.includes(memoDate)
      } catch (err) {
        console.error('Error parsing date:', err)
        return false
      }
    })
  }

  // 按时间倒序排序
  filtered = [...filtered].sort((a, b) => {
    try {
      return new Date(b.time).getTime() - new Date(a.time).getTime()
    } catch (err) {
      console.error('Error sorting dates:', err)
      return 0
    }
  })

  return filtered
})

// 方法
const addMemo = (memo: Memo) => {
  if (isEditing.value && editingIndex.value !== -1) {
    // 更新现有备忘录
    memos.value[editingIndex.value] = memo
    isEditing.value = false
    editingIndex.value = -1
  } else {
    // 添加新备忘录
    memos.value.unshift(memo)
  }
  // 按时间从新到旧排序
  memos.value.sort((a, b) => {
    return new Date(b.time).getTime() - new Date(a.time).getTime()
  })
}

const editMemo = (index: number) => {
  isEditing.value = true
  editingIndex.value = index
  
  // 在窄屏模式下，切换到输入框标签页
  if (!isWideLayout.value) {
    // 使用nextTick确保DOM已经更新
    nextTick(() => {
      switchTab('input')
      // 聚焦到输入框
      enEventBus.emit(EN_EVENT_BUS_KEYS.MEMO_FOCUS_INPUT)
    })
  } else {
    // 宽屏模式下，直接聚焦到输入框
    enEventBus.emit(EN_EVENT_BUS_KEYS.MEMO_FOCUS_INPUT)
  }
}

const deleteMemo = (index: number) => {
  memos.value.splice(index, 1)
}

const cancelEdit = () => {
  isEditing.value = false
  editingIndex.value = -1
}

const handleDateSelect = (dates: string[]) => {
  selectedDates.value = dates
}

const handleSearch = () => {
  // TODO: 显示搜索界面
  console.log('Show search interface')
}

const handleDailyNote = () => {
  // TODO: 跳转到今日日记
  console.log('Navigate to daily note')
}

// 注册命令
const registerCommands = () => {
  addCommand({
    langKey: 'addMemo',
    hotkey: '⌘+⇧+M',
    callback: () => {
      // 聚焦到输入框
      enEventBus.emit(EN_EVENT_BUS_KEYS.MEMO_FOCUS_INPUT)
    },
  })
}

// 监听事务变化
let offTransactionEvent: (() => void) | null = null

// 监听筛选器变化
watch(activeFilter, (filter) => {
  if (filter === 'daily') {
    // 日记筛选的状态已经在 handleDailyNoteInfo 中处理
    console.log('Daily note filter activated')
  }
})

// 处理日记信息
const handleDailyNoteInfo = (info: { dailyNotes: any[] }) => {
  const dailyNotes = info?.dailyNotes || []

  if (!dailyNotes.length) {
    if (activeFilter.value === 'whiteboard') {
      // 如果是白板筛选，直接使用数据
      memos.value = dailyNotes
    } else {
      // 其他情况，只清空对应类型的数据
      memos.value = memos.value.filter((memo) => memo.type !== activeFilter.value)
    }
    return
  }

  if (activeFilter.value === 'whiteboard') {
    // 如果是白板数据，直接替换
    memos.value = dailyNotes
  } else if (activeFilter.value === 'daily') {
    // 将日记块转换为Memo格式
    const dailyMemos: Memo[] = dailyNotes.map((note) => {
      try {
        const time = getTimeFromBlockId(note.block_id)
        if (!time) return null

        // 添加块类型信息
        return {
          blockId: note.block_id,
          time,
          type: 'daily',
          dailyNoteId: note.doc_id,
          content: note.block_content,
          blockType: note.block_type, // 添加块类型
          dateValue: note.date_value, // 添加日期值
        }
      } catch (err) {
        console.error('Error processing note:', err)
        return null
      }
    }).filter(Boolean) as Memo[]

    console.log('Processed daily memos:', dailyMemos.length)

    // 更新备忘录列表，保留非日记类型的备忘录
    memos.value = [
      ...memos.value.filter((memo) => memo.type !== 'daily'),
      ...dailyMemos,
    ]

    // 更新日历组件的日期标记
    const datesWithNotes = [...new Set(dailyMemos.map((memo) =>
      memo.time.split(' ')[0],
    ))]
    selectedDates.value = datesWithNotes
  } else {
    // 其他类型的数据处理
    const newMemos: Memo[] = dailyNotes.map((note) => ({
      blockId: note.block_id,
      time: note.block_time,
      type: activeFilter.value,
      content: note.block_content,
      blockType: note.block_type, // 添加块类型
    }))

    // 更新备忘录列表，保留其他类型的备忘录
    memos.value = [
      ...memos.value.filter((memo) => memo.type !== activeFilter.value),
      ...newMemos,
    ]
  }
}

// 添加对 memos 的监听
watch(memos, (newMemos) => {
  console.log('Memos changed:', newMemos)
}, { deep: true })

// 添加对 filteredMemos 的监听
watch(() => filteredMemos.value, (newFilteredMemos) => {
  console.log('Filtered memos changed:', newFilteredMemos)
}, { deep: true })

// 定义handleResize函数，避免添加和移除不同的函数引用
const handleResize = () => {
  initContainerWidth()
  updateLayoutMode()
}

// ResizeObserver实例
let resizeObserver: ResizeObserver | null = null

onMounted(() => {
  registerCommands()
  offTransactionEvent = useSiyuanEventTransactions(() => {
    // 可以在这里处理块的自动合并等操作
  })
  
  // 初始化容器宽度
  initContainerWidth()
  
  // 使用nextTick确保DOM已经渲染完成后再检查布局模式
  nextTick(() => {
    updateLayoutMode()
    
    // 设置ResizeObserver监听容器大小变化
    if (containerRef.value && window.ResizeObserver) {
      resizeObserver = new ResizeObserver(() => {
        updateLayoutMode()
      })
      resizeObserver.observe(containerRef.value)
      
      // 监听父容器大小变化
      const parentContainer = document.querySelector('.fn__flex-1.en-dock')
      if (parentContainer) {
        resizeObserver.observe(parentContainer)
      }
    }
  })
  
  // 监听窗口大小变化
  window.addEventListener('resize', handleResize)
  
  // 默认触发日记标签
  activeFilter.value = 'daily'
})

onBeforeUnmount(() => {
  if (offTransactionEvent) {
    offTransactionEvent()
  }
  
  // 移除窗口大小变化监听
  window.removeEventListener('resize', handleResize)
  
  // 移除ResizeObserver
  if (resizeObserver) {
    resizeObserver.disconnect()
    resizeObserver = null
  }
})
</script>

<style lang="scss">
.fn__flex-1.sy__sy-plugin-enhancesy_plugin_enhance_dock,
.fn__flex-1.sy__sy-plugin-enhancesy_plugin_enhance_dock > div,
.fn__flex-1.sy__sy-plugin-enhancesy_plugin_enhance_dock > div > .fn__flex-1.fn__flex-column {
    max-height: 100% !important;
};

.en-user-memo {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0px;
  max-height: 100%;
  overflow: auto;

  // 宽屏布局
  &--wide {
    flex-direction: row;
  }
  
  .en-user-memo-wide-layout {
    display: flex;
    width: 100%;
    height: 100%;
    
    .memo-main-area {
      flex: 1;
      min-width: 0;
      display: flex;
      flex-direction: column;
      overflow: auto;
      padding-right: 16px;
      
      .memo-timeline-area {
        flex: 1;
        min-height: 0;
        overflow: auto;
      }
    }
    
    .memo-side-area {
      width: 280px;
      flex-shrink: 0;
      display: flex;
      flex-direction: column;
      gap: 16px;
      border-left: 1px solid var(--b3-border-color);
      padding-left: 16px;
      overflow-y: auto;
      max-height: 100%;
      
      .memo-calendar-container {
        width: 100%;
        overflow: hidden;
        margin-bottom: 16px;
        height: 300px;
      }
      
      .memo-filter-container {
        width: 100%;
        margin-bottom: 16px;
      }
    }
    
    .memo-input-container {
      margin-bottom: 16px;
    }
  }
  
  // 窄屏布局
  .en-user-memo-narrow-layout {
    display: flex;
    flex-direction: column;
    width: 100%;
    height: 100%;
    overflow: auto;
    
    .memo-filter-container {
      margin-bottom: 8px;
    }
  }

  .memo-top-area {
    flex-shrink: 0;
    overflow: hidden;
    border-radius: var(--b3-border-radius);
    position: relative;
    padding-bottom: 24px;
    margin-bottom: 8px;

    .memo-content-wrapper {
      display: flex;
      width: 200%;
      transform-origin: left;
      transition: transform 0.3s ease;
      user-select: none;

      &:active {
        transition: none;
      }

      .memo-calendar-area {
        width: 50%;
        flex-shrink: 0;
        overflow: hidden;
        height: 300px;
      }

      .memo-input-area {
        width: 50%;
        flex-shrink: 0;
        padding: 0 8px;
        overflow: hidden;
        height: 300px;
      }
    }

    .memo-dots {
      position: absolute;
      bottom: 8px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 8px;

      .dot {
        width: 8px;
        height: 8px;
        border-radius: 4px;
        background: var(--b3-theme-on-surface);
        opacity: 0.15;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

        &.active {
          width: 24px;
          opacity: 0.3;
          background: var(--b3-theme-on-surface);
        }
      }
    }
  }

  .memo-timeline-area {
    flex: 1;
    min-height: 0;
    overflow: auto;
    display: flex;
    flex-direction: column;
    border-radius: var(--b3-border-radius);

    .timeline-header {
      flex-shrink: 0;
      padding-bottom: 8px;
    }

    .timeline-content {
      flex: 1;
      min-height: 0;
      overflow-y: auto;
      overflow-x: hidden;
      padding: 0 8px;

      &::-webkit-scrollbar {
        width: 4px;
      }
      
      &::-webkit-scrollbar-thumb {
        background-color: var(--b3-scroll-color);
        border-radius: 4px;
      }
      
      &::-webkit-scrollbar-track {
        background-color: var(--b3-scroll-track-color);
      }
    }
  }
}

:deep(.timeline-content) {
  overflow-y: auto !important;
  overflow-x: hidden;
  padding: 0 16px 16px;
  
  &::-webkit-scrollbar {
    width: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background-color: var(--b3-scroll-color);
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background-color: var(--b3-scroll-track-color);
  }
}

:deep(.calendar-area),
:deep(.input-area) {
  overflow: hidden;
}

// 调试面板样式
.debug-panel {
  margin-top: 16px;
  padding: 8px;
  border: 1px dashed var(--b3-border-color);
  border-radius: var(--b3-border-radius);
  font-size: 12px;
  
  .debug-info {
    margin-bottom: 8px;
  }
  
  .debug-btn {
    padding: 4px 8px;
    background-color: var(--b3-theme-primary);
    color: var(--b3-theme-on-primary);
    border: none;
    border-radius: var(--b3-border-radius);
    cursor: pointer;
    font-size: 12px;
    
    &:hover {
      opacity: 0.9;
    }
  }
}
</style>
