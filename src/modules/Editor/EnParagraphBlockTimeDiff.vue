<template>
  <a-trigger
    position="top"
    auto-fit-position
    :unmount-on-close="false"
  >
    <div class="TimeDiffTriggerContainer">
      <span class="TimeDiff">
        {{ getDiffFormat(created, bindedCreated, '') }}
      </span>
      <SyIcon
        :class="`${bindedId ? 'binded' : ''}`"
        name="iconClock"
      />
    </div>
    <template #content>
      <div class="BlockTimeDiffContainer">
        <div class="row flexAlignCenter">
          绑定 ID 计算时间差
        </div>
        <div class="row flexAlignCenter">
          <div>
            ID:
          </div>
          <a-input v-model:modelValue="bindedId" />
        </div>
        <div class="row flexAlignCenter">
          距目标块：{{ getDiffFormat(created, bindedCreated, '') }}
        </div>
      </div>
    </template>
  </a-trigger>
</template>

<script setup lang="ts">
import { getDiffFormat } from '@/utils/Date'
import { getCreatedByDataset } from '@/utils/Siyuan'
import {
  updateModuleDataByNamespaceWithLoadFile,
  useSyncModuleData,
} from '@/utils/SyncData'
import dayjs, { Dayjs } from 'dayjs'
import {
  computed,
  ref,
  watchEffect,
} from 'vue'

interface ModuleOptions {
  [key: string]: string
}

const props = defineProps<{
  nodeId: string
}>()
const moduleName = 'EnParagraphBlockTimeDiff'
const module = useSyncModuleData<ModuleOptions>({
  namespace: moduleName,
  defaultData: {},
})
const moduleOptions = computed(() => {
  return module.value.data
})

updateModuleDataByNamespaceWithLoadFile(moduleName)



const getCreatedStr = (nodeId: string) => {
  if (!nodeId) {
    return undefined
  }
  const createdStr = getCreatedByDataset(nodeId)
  if (createdStr) {
    return dayjs(createdStr)
  }
  return undefined
}

const created = computed<Dayjs | undefined>(() => {
  return getCreatedStr(props.nodeId)
})

const bindedId = ref(moduleOptions.value[props.nodeId])
watchEffect(() => {
  moduleOptions.value[props.nodeId] = bindedId.value
})

const bindedCreated = computed<Dayjs | undefined>(() => {
  return getCreatedStr(bindedId.value)
})
</script>

<style lang="scss" scoped>
.TimeDiffTriggerContainer {
  display: flex;
  align-items: center;
  gap: 2px;

  .TimeDiff {
    font-family: monospace;
    font-size: var(--timeFontSize);
  }

  & .binded {
    color: var(--sky-blue);
  }
}
.BlockTimeDiffContainer {
  background-color: var(--b3-theme-background);
  border: 1px solid var(--b3-list-hover);
  display: flex;
  flex-direction: column;
  padding: 10px;

  gap: var(--en-gap);
}
</style>
