<template>
  <div class="en-user-memo">
    <div class="memo-input-area">
      <MemoInput
        :is-editing="isEditing"
        :editing-block-id="editingBlockId"
        @submit="addMemo"
        @cancel="cancelEdit"
      />
    </div>
    <div class="memo-toolbar">
      <div class="left">
        <a-button-group>
          <a-button>全部</a-button>
          <a-button>今天</a-button>
          <a-button>本周</a-button>
          <a-button>本月</a-button>
        </a-button-group>
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
        :memos="memos"
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
import MemoInput from './components/MemoInput.vue'
import MemoTimeline from './components/MemoTimeline.vue'

// 状态
const memos = ref<Memo[]>([])
const isEditing = ref(false)
const editingIndex = ref(-1)

const editingBlockId = computed(() => {
  if (isEditing.value && editingIndex.value !== -1) {
    return memos.value[editingIndex.value].blockId
  }
  return ''
})

// 方法
const addMemo = (blockId: string) => {
  if (isEditing.value && editingIndex.value !== -1) {
    // 更新现有备忘录
    memos.value[editingIndex.value] = {
      blockId,
      time: `${new Date().toLocaleString()} (已编辑)`,
    }
    isEditing.value = false
    editingIndex.value = -1
  } else {
    // 添加新备忘录
    memos.value.unshift({
      blockId,
      time: new Date().toLocaleString(),
    })
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

  .memo-input-area {
    flex-shrink: 0;
    width: 100%;
  }

  .memo-toolbar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 4px 0;
  }

  .memo-timeline-area {
    flex: 1;
    overflow: hidden;
  }
}
</style>
