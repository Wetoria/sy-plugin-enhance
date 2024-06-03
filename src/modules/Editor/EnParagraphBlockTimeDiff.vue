<template>
  <a-trigger
    position="top"
    auto-fit-position
    :unmount-on-close="false"
  >
    <div class="TimeDiffTriggerContainer">
      <SyIcon
        :class="`${bindedId ? 'binded' : ''}`"
        name="iconClock"
      />
      <span class="TimeDiff">
        {{ getDiffFormat(created, bindedCreated, '') }}
      </span>
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
          距目标块：{{  getDiffFormat(created, bindedCreated, '') }}
        </div>
      </div>
    </template>
  </a-trigger>
</template>

<script setup lang="ts">
import { getCreatedByDataset } from '@/utils/Siyuan';
import { computed, ref, watchEffect } from 'vue';
import dayjs from 'dayjs'
import { useSettings } from '../Settings/EnSettings.vue';
import { getDiffFormat } from '@/utils/Date';


const settings = useSettings()


const props = defineProps<{
  nodeId: string
}>()

const created = computed(() => {
  const createdStr = getCreatedByDataset(props.nodeId)
  if (createdStr) {
    return dayjs(createdStr)
  }
  return
})

const bindedId = ref(settings.value.timeDiff[props.nodeId])
watchEffect(() => {
  settings.value.timeDiff[props.nodeId] = bindedId.value
})

const bindedCreated = computed(() => {
  const createdStr = getCreatedByDataset(bindedId.value)
  if (createdStr) {
    return dayjs(createdStr)
  }
  return
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
