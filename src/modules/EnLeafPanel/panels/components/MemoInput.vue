<template>
  <div class="memo-input-card">
    <div class="memo-editor">
      <EnProtyle
        :block-id="blockId"
        disableEnhance
        @after="afterProtyleLoad"
      />
      <div
        ref="protyleUtilAreaRef"
        class="protyle-util-area"
      ></div>
      <div
        v-if="isMergingToSuperBlock"
        class="merging-indicator"
      >
        <svg class="rotating"><use xlink:href="#iconRefresh"></use></svg>
      </div>
    </div>
    <div class="divider"></div>
    <div class="memo-toolbar">
      <button
        class="b3-button b3-button--outline"
        @click="handleSubmit"
      >
        {{ isEditing ? '更新' : '添加' }}
      </button>
      <button
        v-if="isEditing"
        class="b3-button b3-button--text"
        @click="handleCancel"
      >
        取消
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Protyle } from 'siyuan'
import type { PropType } from 'vue'
import type { Memo } from './MemoTimeline.vue'
import EnProtyle from '@/components/EnProtyle.vue'
import { getNewDailyNoteBlockId } from '@/modules/DailyNote/DailyNote'
import { debounce } from '@/utils'
import { EN_EVENT_BUS_KEYS } from '@/utils/Constants'
import { enEventBus } from '@/utils/EnEventBus'
import {
  useSiyuanDatabaseIndexCommit,
} from '@/utils/EventBusHooks'
import {
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue'

interface Props {
  isEditing: boolean
  editingBlockId?: string
  editingMemo?: Memo
}

const props = defineProps({
  isEditing: {
    type: Boolean,
    default: false,
  },
  editingBlockId: {
    type: String,
    default: '',
  },
  editingMemo: {
    type: Object as PropType<Memo>,
    default: undefined,
  },
})

const emit = defineEmits<{
  (e: 'submit', memo: Memo): void
  (e: 'cancel'): void
}>()

const blockId = ref('')
const protyleRef = ref<Protyle | null>(null)
const protyleUtilAreaRef = ref<HTMLDivElement | null>(null)
const isMergingToSuperBlock = ref(false)

const targetProtyleUtilClassList = [
  'protyle-gutters',
  'protyle-select',
  'protyle-toolbar',
  'protyle-hint',
]

const afterProtyleLoad = (protyle: Protyle) => {
  protyleRef.value = protyle

  // 移动工具区域到指定位置
  targetProtyleUtilClassList.forEach((className) => {
    const target = protyle.protyle.element.querySelector(`.${className}`)
    if (target) {
      protyleUtilAreaRef.value?.appendChild(target)
    }
  })
}

const handleSubmit = () => {
  if (protyleRef.value) {
    const content = protyleRef.value.protyle.wysiwyg.element.textContent.trim()
    if (content) {
      // 检查是否需要合并块
      const children = Array.from(protyleRef.value.protyle.wysiwyg.element?.children || [])
      if (children.length > 1) {
        const protyleIns = protyleRef.value.protyle.getInstance()
        isMergingToSuperBlock.value = true
        protyleIns.turnIntoOneTransaction(children, 'BlocksMergeSuperBlock', 'row')
        const off = useSiyuanDatabaseIndexCommit(debounce(async () => {
          off()

          const memo: Memo = {
            blockId: blockId.value,
            time: new Date().toLocaleString() + (props.isEditing ? ' (已编辑)' : ''),
            hasTimestamp: false,
          }
          emit('submit', memo)

          // 创建新的块ID
          if (!props.isEditing) {
            getNewDailyNoteBlockId().then((id) => {
              blockId.value = id
            })
          }
        }, 20))
      } else {
        const memo: Memo = {
          blockId: blockId.value,
          time: new Date().toLocaleString() + (props.isEditing ? ' (已编辑)' : ''),
          hasTimestamp: false,
        }
        emit('submit', memo)

        // 创建新的块ID
        if (!props.isEditing) {
          getNewDailyNoteBlockId().then((id) => {
            blockId.value = id
          })
        }
      }
    }
  }
}

const handleCancel = () => {
  emit('cancel')
  if (props.isEditing) {
    // 如果是编辑模式取消，创建新的块ID
    getNewDailyNoteBlockId().then((id) => {
      blockId.value = id
    })
  }
}

watch(() => props.editingMemo, (newMemo) => {
  if (newMemo) {
    // 不需要监听 hasTimestamp 的变化
  }
}, { immediate: true })

watch(() => props.editingBlockId, (newBlockId) => {
  if (newBlockId) {
    blockId.value = newBlockId
  } else {
    getNewDailyNoteBlockId().then((id) => {
      blockId.value = id
    })
  }
}, { immediate: true })

onMounted(() => {
  // 监听聚焦事件
  enEventBus.on(EN_EVENT_BUS_KEYS.MEMO_FOCUS_INPUT, () => {
    if (protyleRef.value) {
      protyleRef.value.protyle.wysiwyg.element.focus()
    }
  })
})

onBeforeUnmount(() => {
  // 清理聚焦事件监听
  enEventBus.off(EN_EVENT_BUS_KEYS.MEMO_FOCUS_INPUT, () => {})
})
</script>

<style lang="scss">
.en-user-memo .EnProtyleContainer .protyle .protyle-wysiwyg {
  padding: 0px !important;
}

.en-user-memo  .EnProtyleContainer .protyle .protyle-content {
  padding: unset !important;
}

.en-user-memo .memo-input-card {
  background: var(--b3-theme-background);
  border-radius: var(--b3-border-radius);
  padding: 0px;
  width: calc(100% - 16px);
  margin-right: 8px;
  height: 100%;
  display: flex;
  flex-direction: column;

  .memo-editor {
    position: relative;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;

    :deep(.EnProtyleContainer) {
      flex: 1;
      min-height: 0;
      display: flex;
      flex-direction: column;

      .protyle {
        flex: 1;
        min-height: 0;
        display: flex;
        flex-direction: column;

        .protyle-content {
          flex: 1;
          min-height: 0;
          display: flex;
          flex-direction: column;

          .protyle-wysiwyg {
            flex: 1;
            min-height: 0;
            padding: 8px !important;
          }
        }
      }
    }
  }

  .protyle-util-area {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    pointer-events: none;
    z-index: 1;

    :deep(*) {
      pointer-events: auto;
    }
  }

  .divider {
    height: 1px;
    background-color: var(--b3-border-color);
    opacity: 0.3;
    margin: 8px 0;
  }

  .memo-toolbar {
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 0 8px;
  }

  .merging-indicator {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    z-index: 2;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;

    svg {
      width: 100%;
      height: 100%;
      fill: var(--b3-theme-primary);
      animation: rotating 1s linear infinite;
    }

    @keyframes rotating {
      from {
        transform: rotate(0deg);
      }
      to {
        transform: rotate(360deg);
      }
    }
  }
}
</style>
