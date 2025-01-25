<template>

</template>

<script setup lang="ts">
import { usePlugin } from '@/main'
import {
  injectGlobalWindowData,
} from '@/modules/EnModuleControl/ModuleProvide'
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

const globalWindowData = injectGlobalWindowData()


const isFlashCardProtyle = (protyleEl: HTMLElement) => {
  return protyleEl?.classList?.contains?.('card__block')
}
const isEditorProtyle = (protyleEl: HTMLElement) => {
  if (plugin.isMobile) {
    return protyleEl.id === 'editor'
  }
  const { editor: editorList } = getAllModels()
  const isEditorProtyle = editorList.some((item: any) => item.editor.protyle.element === protyleEl)
  return isEditorProtyle
}

const getDailyNoteInfoByProtyleContentEl = (protyleContentEl: HTMLElement) => {
  const wysiwygEl: HTMLDivElement = protyleContentEl.querySelector('.protyle-wysiwyg')
  if (!wysiwygEl) {
    return {
      isDailyNote: false,
      dailyNoteValues: {},
    }
  }
  const attrs = wysiwygEl?.getAttributeNames() || []
  const containsDailyNoteAttr = attrs.filter((i) => i.startsWith('custom-dailynote'))
  const isDailyNote = !!containsDailyNoteAttr.length
  const dailyNoteValues = {}
  containsDailyNoteAttr.forEach((i) => {
    dailyNoteValues[i] = wysiwygEl?.getAttribute(i) || ''
  })
  if (isDailyNote) {
    protyleContentEl.dataset.en_is_dailynote = 'true'
    wysiwygEl.dataset.en_is_dailynote = 'true'
  }
  return {
    isDailyNote,
    dailyNoteValues,
  }
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

    const {
      isDailyNote,
      dailyNoteValues,
    } = getDailyNoteInfoByProtyleContentEl(protyleContentEl)


    const docId = protyleTitleEl.dataset.nodeId
    const dialog = protyleContentEl.closest('.block__popover') as HTMLElement

    globalWindowData.value.protyleList.push({
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
    })
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

    const {
      isDailyNote,
      dailyNoteValues,
    } = getDailyNoteInfoByProtyleContentEl(protyle.contentElement)

    const dialog = protyle.contentElement.closest('.block__popover') as HTMLElement

    globalWindowData.value.protyleList.push({
      enLoopKey: generateUUIDWithTimestamp(),
      protyleBlockId: protyle.block.id,
      protyleEl: protyle.element,
      protyleContentEl: protyle.contentElement,

      isFlashCardProtyle: isFlashCardProtyle(protyle.element),
      isEditorProtyle: isEditorProtyle(protyle.element),
      isInDialog: !!dialog,
      dialogEl: dialog,
      isDailyNote,
      dailyNoteValues,
    })
  })
}

const offOnLoadedProtyleStatic = useSiyuanEventLoadedProtyleStatic(({ detail }) => {
  const protyle = detail.protyle as IProtyle
  const protyleEl = protyle.element

  const existRef = globalWindowData.value.protyleList.find((item) => item.protyleEl === protyleEl)
  if (existRef) {
    globalWindowData.value.protyleList = globalWindowData.value.protyleList.filter((item) => item.protyleEl !== protyleEl)
  }

  const {
    isDailyNote,
    dailyNoteValues,
  } = getDailyNoteInfoByProtyleContentEl(protyle.contentElement)

  const dialog = protyle.contentElement.closest('.block__popover') as HTMLElement

  globalWindowData.value.protyleList = [
    ...globalWindowData.value.protyleList,
    {
      enLoopKey: generateUUIDWithTimestamp(),
      protyleBlockId: protyle.block.id,
      protyleEl,
      protyleContentEl: protyle.contentElement,

      isFlashCardProtyle: isFlashCardProtyle(protyle.element),
      isEditorProtyle: isEditorProtyle(protyle.element),
      isInDialog: !!dialog,
      dialogEl: dialog,
      isDailyNote,
      dailyNoteValues,
    },
  ]
})

const offOnProtyleDestroy = useSiyuanEventProtyleDestroy(({ detail }) => {
  let target = null
  globalWindowData.value.protyleList = globalWindowData.value.protyleList.filter((item) => {
    const isTarget = item.protyleEl === detail.protyle.element
    if (isTarget) {
      target = item
    }
    return !isTarget
  })
  if (target) {
    Object.keys(target).forEach((key) => {
      target[key] = null
    })
    target = null
  }
})

onMounted(() => {
  recordProtyleContentOnInit()
})

onBeforeUnmount(() => {
  offOnProtyleDestroy()
  offOnLoadedProtyleStatic()
  globalWindowData.value.protyleList.forEach((item) => {
    Object.keys(item).forEach((key) => {
      item[key] = null
    })
  })
  globalWindowData.value.protyleList = []
})
</script>

<style lang="scss" scoped>

</style>
