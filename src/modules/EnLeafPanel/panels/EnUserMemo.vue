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
    <div class="memo-toolbar">
      <div class="filter-group">
        <a-checkbox-group v-model="selectedFilters">
          <a-checkbox value="annotation">
            批注
          </a-checkbox>
          <a-checkbox value="lifelog">
            生活记录
          </a-checkbox>
          <a-checkbox value="whiteboard">
            白板
          </a-checkbox>
          <a-checkbox value="diary">
            日记
          </a-checkbox>
          <a-checkbox value="timestamp">
            时间戳
          </a-checkbox>
        </a-checkbox-group>
      </div>
      <div class="right">
        <a-button-group>
          <a-button>
            <template #icon>
              <IconSortAscending />
            </template>
          </a-button>
          <a-button>
            <template #icon>
              <IconSortDescending />
            </template>
          </a-button>
        </a-button-group>
      </div>
    </div>
    <div class="memo-timeline-area">
      <MemoTimeline
        :memos="filteredMemos"
        @edit="editMemo"
        @delete="deleteMemo"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Memo } from './components/MemoTimeline.vue'
import { addCommand } from '@/utils/Commands'
import { EN_EVENT_BUS_KEYS } from '@/utils/Constants'
import { enEventBus } from '@/utils/EnEventBus'
import { useSiyuanEventTransactions } from '@/utils/EventBusHooks'
import {
  IconSortAscending,
  IconSortDescending,
} from '@arco-design/web-vue/es/icon'
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
} from 'vue'
import MemoCalendar from './components/MemoCalendar.vue'
import MemoInput from './components/MemoInput.vue'
import MemoTimeline from './components/MemoTimeline.vue'

// 状态
const memos = ref<Memo[]>([])
const isEditing = ref(false)
const editingIndex = ref(-1)
const selectedFilters = ref<string[]>([])
const selectedDates = ref<string[]>([])

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

// 根据选中的筛选条件和日期过滤备忘录
const filteredMemos = computed(() => {
  let filtered = memos.value

  // 按日期筛选
  if (selectedDates.value.length > 0) {
    filtered = filtered.filter((memo) => {
      const memoDate = new Date(memo.time).toISOString().split('T')[0]
      return selectedDates.value.includes(memoDate)
    })
  }

  // 按类型筛选
  if (selectedFilters.value.length > 0) {
    filtered = filtered.filter((memo) => {
      return selectedFilters.value.some((filter) => {
        switch (filter) {
          case 'annotation':
            return memo.type === 'annotation'
          case 'lifelog':
            return memo.type === 'lifelog'
          case 'whiteboard':
            return memo.type === 'whiteboard'
          case 'diary':
            return memo.type === 'diary'
          case 'timestamp':
            return memo.hasTimestamp
          default:
            return false
        }
      })
    })
  }

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

  .memo-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 0;

    .filter-group {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
  }

  .memo-timeline-area {
    flex: 1;
    overflow: hidden;
  }
}
</style>
