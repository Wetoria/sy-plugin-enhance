<template>
  <span
    :class="`enBlockTimeContainer ${updatedFormatted ? 'updated' : ''}`"
    @click="showCreated = !showCreated"
    v-html="styledFormatted"
  >
  </span>
</template>

<script setup lang="ts">
import { injectGlobalWindowData } from '@/modules/EnModuleControl/ModuleProvide'
import dayjs from 'dayjs'
import {
  computed,
  ref,
  watchEffect,
} from 'vue'
import {
  FORMAT_DATE,
  FORMAT_TIME,
} from './EnParagraphBlockAttrContainer.vue'

const props = defineProps<{
  pDom: HTMLDivElement
  updated: undefined | dayjs.Dayjs
  updatedFormatted: string
  created: undefined | dayjs.Dayjs
  createdFormatted: string
  defaultBlockType: 'created' | 'updated'
  alwaysShowYMD?: boolean
}>()


const showCreated = ref(props.defaultBlockType === 'created')
watchEffect(() => {
  showCreated.value = props.defaultBlockType === 'created'
})

const globalWindowData = injectGlobalWindowData()
const protyleContentRefList = computed<IProtyleObserverItem[]>(() => {
  return globalWindowData.value.protyleList
})

const protyleRef = computed<IProtyleObserverItem>(() => {
  const protyleElement = props.pDom.closest('.protyle') as HTMLElement
  return protyleContentRefList.value.find((i) => i.protyleEl === protyleElement)
})
const protyleDailyNoteAttrs = computed<string[]>(() => {
  return Object.values(protyleRef.value?.dailyNoteValues || {})
})

const styledFormatted = computed(() => {
  const value = showCreated.value ? props.created : props.updated
  if (!value) {
    return
  }
  const ymd = value.format(FORMAT_DATE)
    .replace(/\//g, `<span class="EnBlockTimeDivider ${showCreated.value ? 'showCreate' : 'showUpdated'}">/</span>`)
  const hms = value.format(FORMAT_TIME)
    .replace(/:/g, `<span class="EnBlockTimeDivider ${showCreated.value ? 'showCreate' : 'showUpdated'}">:</span>`)

  const isOnlyOne = protyleDailyNoteAttrs.value.length === 1
  const isSameDate = isOnlyOne && protyleDailyNoteAttrs.value[0] === value.format('YYYYMMDD')

  const hideYMD = !props.alwaysShowYMD && (isOnlyOne && isSameDate)
  return `
    <span class="enBlockTimeContent">
      <span>${showCreated.value ? '创建于:' : '更新于:'}</span>
      <span class="enBlockTimeYMD${hideYMD ? ' hidden' : ''}">${ymd}</span>
      <span class="enBlockTimeHMS">${hms}</span>
    </span>
  `
})
</script>

<style lang="scss" scoped>
.enBlockTimeContainer {
  position: relative;
  font-size: var(--enTimeFontSize);

  :deep(.enBlockTimeContent) {

    .EnBlockTimeDivider {
      font-size: var(--enTimeFontSize);
      &.showUpdated {
        color: var(--sky-blue);
      }
    }

    .enBlockTimeYMD {
      &.hidden {
        display: none;
      }
    }
  }
}
</style>

<style lang="scss">

</style>
