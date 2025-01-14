<template>
  <div class="EnBlockAppendModeSelectorContainer">
    <div class="flexAlignCenter">
      追加至：
    </div>
    <a-select
      v-model="notebookId"
      class="EnBlockAppendModeSelector"
      placeholder="请选择"
      v-bind="$attrs"
      :trigger-props="{
        contentClass: 'EnBlockAppendModeSelectorTriggerContent',
      }"
      @change="onSelectChange"
    >
      <a-option
        v-for="option of options"
        :key="option.id"
        :value="option.id"
        :label="option.name"
      >
      </a-option>
    </a-select>
    <a-input
      v-if="notebookId?.startsWith('target')"
      v-model="targetId"
      class="EnBlockAppendModeTargetIdInput"
    />
    <a-tooltip content="This is tooltip content">
      <icon-exclamation-circle />
    </a-tooltip>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  notebookList: Notebook[]
  mode?: Array<'All' | 'targetDoc' | 'targetBlock' | 'currentDoc' | 'currentBlock'>
}>()
const notebookId = defineModel<string>()
const targetId = defineModel<string>('targetId')

const modeList = [
  {
    id: 'targetDoc',
    name: '目标文档',
  },
  {
    id: 'targetBlock',
    name: '目标块',
  },
  {
    id: 'currentDoc',
    name: '当前文档',
  },
  {
    id: 'currentBlock',
    name: '当前块',
  },
]

const options = computed(() => {
  const result = [
  ]

  if (props.mode?.includes('All')) {
    result.push(...modeList)
  } else {
    props.mode?.forEach((mode) => {
      const modeItem = modeList.find((item) => item.id === mode)
      if (modeItem) {
        result.push(modeItem)
      }
    })
  }
  props.notebookList?.forEach((notebook) => {
    result.push({
      id: notebook.id,
      name: `笔记本：${notebook.name} 的日记中`,
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

  :deep(.EnBlockAppendModeSelector) {
    width: fit-content;
  }

  :deep(.EnBlockAppendModeTargetIdInput) {
    width: 180px;
  }
}
</style>

<style lang="scss">
.EnBlockAppendModeSelectorTriggerContent {
  width: fit-content;
}
</style>
