<template>
  <div class="EnBlockAppendModeSelectorContainer">
    <div class="EnBlockAppendModeSelectorTips flexAlignCenter">
      <a-tooltip
        v-if="showTips"
      >
        <slot
          name="tipIcon"
        >
          <icon-exclamation-circle style="color: rgb(var(--warning-6))" />
        </slot>
        <template #content>
          <slot
            name="tips"
          >
            <div
              v-for="item of usedModeList"
              :key="item.id"
            >
              {{ `${item.name}: ${item.desc}` }}
            </div>
            <div>
              笔记本：追加到笔记本的日记中
            </div>
            <div>
              提示：插件会自动根据块 ID 选择创建的方式，以保证符合思源内部的处理方式。
            </div>
          </slot>
          <slot name="extraTips"></slot>
        </template>
      </a-tooltip>
    </div>
    <div
      v-if="showPrompt"
      class="flexAlignCenter"
      style="
        width: max-content;
        flex-shrink: 0;
      "
    >
      <slot name="prompt">
        追加至：
      </slot>
    </div>
    <a-select
      v-bind="$attrs"
      v-model="notebookId"
      class="EnBlockAppendModeSelector"
      :class="{
        isSelectedNotebook,
      }"
      placeholder="请选择"
      :trigger-props="{
        contentClass: 'EnBlockAppendModeSelectorTriggerContent',
      }"
      @change="onSelectChange"
    >
      <a-option
        v-for="option of options"
        :key="option.id"
        :value="option.id"
      >
        <span>{{ option.name }}</span>
      </a-option>
    </a-select>
    <a-input
      v-if="notebookId?.startsWith('target')"
      v-model="targetId"
      class="EnBlockAppendModeTargetIdInput"
      placeholder="请输入块 ID"
    />
  </div>
</template>

<script setup lang="ts">
import { isAppendDailyNoteMode } from '@/utils/Block'
import { computed } from 'vue'

const props = defineProps<{
  notebookList: Notebook[]
  mode?: Array<'All' | 'targetDoc' | 'targetBlock' | 'currentDoc' | 'currentBlock'>

  showPrompt?: boolean
  showTips?: boolean
}>()
const notebookId = defineModel<string>()
const targetId = defineModel<string>('targetId')

const isSelectedNotebook = computed(() => {
  return isAppendDailyNoteMode(notebookId.value)
})

const modeList = [
  {
    id: 'targetDoc',
    name: '目标文档',
    desc: '追加内容到目标文档中，同【目标块】模式',
  },
  {
    id: 'targetBlock',
    name: '目标块',
    desc: '追加内容到目标块中',
  },
  {
    id: 'currentDoc',
    name: '当前文档',
    desc: '追加内容到当前文档中',
  },
  {
    id: 'currentBlock',
    name: '当前块',
    desc: '追加内容到当前块中',
  },
]

const usedModeList = computed(() => {
  if (props.mode?.includes('All')) {
    return modeList
  } else {
    return modeList.filter((item) => props.mode?.includes(item.id as any))
  }
})

const options = computed(() => {
  const result = [
  ]

  result.push(...usedModeList.value)
  props.notebookList?.forEach((notebook) => {
    result.push({
      id: notebook.id,
      name: props.showPrompt ? `笔记本：${notebook.name} 的日记中` : `笔记本：${notebook.name}`,
    })
  })

  return result
})

const onSelectChange = () => {
  targetId.value = ''
}
</script>

<style lang="scss" scoped>
.EnBlockAppendModeSelectorContainer {
  display: flex;
  gap: var(--en-gap);
  align-items: center;

  :deep(.EnBlockAppendModeTargetIdInput) {
    width: 180px;
    flex-shrink: 0;
  }

  .EnBlockAppendModeSelectorTips {
    flex-shrink: 0;
    width: max-content;
  }
}
</style>

<style lang="scss">
.EnBlockAppendModeSelectorTriggerContent {
  width: fit-content;
}
</style>
