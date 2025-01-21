<template>
  <template
    v-for="item of protyleContentRefList"
    :key="item.protyleBlockId"
  >
    <EnLifeLogDailyNoteGraph
      :element="item.protyleContentEl"
    />
  </template>
</template>

<script setup lang="ts">
import { usePlugin } from '@/main'
import { markProtyleIsDailyNote } from '@/modules/DailyNote/DailyNote'
import EnLifeLogDailyNoteGraph from '@/modules/LifeLog/EnLifeLogDailyNoteGraph.vue'
import { generateUUIDWithTimestamp } from '@/utils'
import {
  useSiyuanEventLoadedProtyleStatic,
  useSiyuanEventProtyleDestroy,
} from '@/utils/EventBusHooks'
import {
  getAllModels,
  IProtyle,
} from 'siyuan'
import {
  onBeforeUnmount,
  onMounted,
  ref,
} from 'vue'

const plugin = usePlugin()

const protyleContentRefList = ref<{
  enLoopKey: string
  protyleBlockId: string
  protyleEl: HTMLElement
  protyleContentEl: HTMLElement
}[]>([])

const isEditorProtyle = (protyleEl: HTMLElement) => {
  if (plugin.isMobile) {
    return protyleEl.id === 'editor'
  }
  const { editor: editorList } = getAllModels()
  const isEditorProtyle = editorList.some((item: any) => item.editor.protyle.element === protyleEl)
  return isEditorProtyle
}

const recordProtyleContentOnInit = () => {
  // 移动端初始化获取 protyle 的逻辑
  if (plugin.isMobile) {
    const protyle = document.getElementById('editor')
    if (!protyle) {
      enWarn('protyle is not found')
      return
    }
    const protyleContentEl = protyle.querySelector('.protyle-content') as HTMLElement
    if (!protyleContentEl) {
      enWarn('protyleContentEl is not found')
      return
    }
    const protyleTitleEl = protyle.querySelector('.protyle-top .protyle-title') as HTMLElement
    if (!protyleTitleEl) {
      enWarn('protyleTitleEl is not found')
      return
    }
    const docId = protyleTitleEl.dataset.nodeId
    markProtyleIsDailyNote(protyleContentEl)
    protyleContentRefList.value.push({
      enLoopKey: generateUUIDWithTimestamp(),
      protyleBlockId: docId,
      protyleEl: protyle,
      protyleContentEl,
    })
    return
  }

  // 桌面端获取 protyle 列表的逻辑
  const { editor: editorList } = getAllModels()
  editorList.forEach((item: any) => {
    const {
      editor,
    } = item
    const protyle = editor.protyle as IProtyle
    markProtyleIsDailyNote(protyle.contentElement)
    protyleContentRefList.value.push({
      enLoopKey: generateUUIDWithTimestamp(),
      protyleBlockId: protyle.block.id,
      protyleEl: protyle.element,
      protyleContentEl: protyle.contentElement,
    })
  })
}

const offOnLoadedProtyleStatic = useSiyuanEventLoadedProtyleStatic(({ detail }) => {
  const protyle = detail.protyle as IProtyle
  const protyleEl = protyle.element
  if (!isEditorProtyle(protyleEl)) {
    enWarn('protyle is not flash card or editor')
    return
  }

  const existRef = protyleContentRefList.value.find((item) => item.protyleEl === protyleEl)
  if (existRef) {
    existRef.protyleBlockId = protyle.block.id
    existRef.protyleContentEl = protyle.contentElement
    existRef.protyleEl = protyleEl
    return
  }

  markProtyleIsDailyNote(protyle.contentElement)
  protyleContentRefList.value.push({
    enLoopKey: generateUUIDWithTimestamp(),
    protyleBlockId: protyle.block.id,
    protyleEl,
    protyleContentEl: protyle.contentElement,
  })
})

const offOnProtyleDestroy = useSiyuanEventProtyleDestroy(({ detail }) => {
  protyleContentRefList.value = protyleContentRefList.value.filter((item) => item.protyleEl !== detail.protyle.element)
})

onMounted(() => {
  recordProtyleContentOnInit()
})
onBeforeUnmount(() => {
  protyleContentRefList.value = []
  offOnLoadedProtyleStatic()
  offOnProtyleDestroy()
})
</script>

<style lang="scss" scoped>

</style>
