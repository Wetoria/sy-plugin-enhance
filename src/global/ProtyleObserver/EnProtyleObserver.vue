<template>

</template>

<script setup lang="ts">
import {
  getDailyNoteInfoByProtyleContentEl,
  isEditorProtyle,
  isFlashCardProtyle,
} from '@/global/Protyle'
import {
  recordProtyleItem,
  recordProtyleItemByProtyle,
  removeFromProtyleList,
  unbindAllProtyleItem,
} from '@/global/ProtyleList'
import { usePlugin } from '@/main'
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
} from 'vue'

const plugin = usePlugin()


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

    const {
      isDailyNote,
      dailyNoteValues,
    } = getDailyNoteInfoByProtyleContentEl(protyleContentEl)


    const docId = protyleTitleEl.dataset.nodeId
    const dialog = protyleContentEl.closest('.block__popover') as HTMLElement

    const protyleItem: IProtyleObserverItem = {
      enLoopKey: generateUUIDWithTimestamp(),
      protyleBlockId: docId,
      protyleEl: protyle,
      protyleContentEl,

      isFlashCardProtyle: isFlashCardProtyle(protyleContentEl),
      isEditorProtyle: isEditorProtyle(protyleContentEl),
      isInDialog: !!dialog,
      dialogEl: dialog,
      isDailyNote,
      dailyNoteValues,
    }
    recordProtyleItem(protyleItem)
    return
  }

  // 桌面端获取 protyle 列表的逻辑
  // 暂时只获取编辑区的 protyle
  const {
    editor: editorList,
  } = getAllModels()
  editorList.forEach((item: any) => {
    const {
      editor,
    } = item
    const protyle = editor.protyle as IProtyle

    recordProtyleItemByProtyle(protyle)

  })
}

const offOnLoadedProtyleStatic = useSiyuanEventLoadedProtyleStatic(({ detail }) => {
  const protyle = detail.protyle as IProtyle

  recordProtyleItemByProtyle(protyle)
})

const offOnProtyleDestroy = useSiyuanEventProtyleDestroy(({ detail }) => {
  removeFromProtyleList(detail.protyle.element)
})

onMounted(() => {
  recordProtyleContentOnInit()
})

onBeforeUnmount(() => {
  offOnProtyleDestroy()
  offOnLoadedProtyleStatic()
  unbindAllProtyleItem()
})
</script>

<style lang="scss" scoped>

</style>
