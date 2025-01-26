<template>
  <div class="en-user-memo">
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
    <div class="memo-timeline-area">
      <div class="timeline-header">
        <MemoFilter
          v-model="activeFilter"
          @dailyNoteInfo="handleDailyNoteInfo"
        />
      </div>
      <div class="timeline-content">
        <MemoTimeline
          :memos="filteredMemos"
          @edit="editMemo"
          @delete="deleteMemo"
        />
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
} from 'vue'
import MemoCalendar from './components/MemoCalendar.vue'
import MemoFilter from './components/MemoFilter.vue'
import MemoInput from './components/MemoInput.vue'
import MemoTimeline from './components/MemoTimeline.vue'

// 状态
const memos = ref<Memo[]>([])
const isEditing = ref(false)
const editingIndex = ref(-1)
const selectedDates = ref<string[]>([])
const activeFilter = ref<FilterType>()

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

        return {
          blockId: note.block_id,
          time,
          type: 'daily',
          dailyNoteId: note.doc_id,
          content: note.block_content,
        }
      } catch (err) {
        console.error('Error processing note:', err)
        return null
      }
    }).filter(Boolean) as Memo[]

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

onMounted(() => {
  registerCommands()
  offTransactionEvent = useSiyuanEventTransactions(() => {
    // 可以在这里处理块的自动合并等操作
  })
})

onBeforeUnmount(() => {
  if (offTransactionEvent) {
    offTransactionEvent()
  }
})
</script>

<style lang="scss">
.en-user-memo {
  display: flex;
  flex-direction: column;
  height: 100%;
  gap: 8px;
  padding: 8px;

  .memo-calendar-area {
    flex-shrink: 0;
  }

  .memo-input-area {
    flex-shrink: 0;
    width: 100%;
  }

  .memo-timeline-area {
    flex: 1;
    overflow: hidden;
    display: flex;
    flex-direction: column;

    .timeline-header {
      flex-shrink: 0;
      border-bottom: 1px solid var(--b3-border-color);
    }

    .timeline-content {
      flex: 1;
      overflow: auto;
      min-height: 0;
    }
  }
}
</style>
