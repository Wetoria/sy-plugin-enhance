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
          v-model:active-filter="activeFilter"
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

// 根据选中的日期过滤备忘录
const filteredMemos = computed(() => {
  let filtered = memos.value

  // 按日期筛选
  if (selectedDates.value.length > 0) {
    filtered = filtered.filter((memo) => {
      const memoDate = new Date(memo.time).toISOString().split('T')[0]
      return selectedDates.value.includes(memoDate)
    })
  }

  // 默认按时间倒序排序
  filtered = [...filtered].sort((a, b) => {
    return new Date(b.time).getTime() - new Date(a.time).getTime()
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
    // TODO: 显示日记筛选界面
    console.log('Show daily notes interface')
  }
})

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
