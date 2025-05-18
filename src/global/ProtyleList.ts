import {
  getDailyNoteInfoByProtyleContentEl,
  isEditorProtyle,
  isFlashCardProtyle,
} from '@/global/Protyle'
import { generateUUIDWithTimestamp } from '@/utils'
import { IProtyle } from 'siyuan'
import { ref } from 'vue'

const protyleList = ref<IProtyleObserverItem[]>([])

export const useProtyleList = () => {
  return protyleList
}

export const existInProtyleList = (protyleEl: HTMLElement) => {
  return protyleList.value.find((item) => item.protyleEl === protyleEl)
}

const removeProtyleItem = (protyleItem: IProtyleObserverItem) => {
  protyleList.value = protyleList.value.filter((item) => item.protyleEl !== protyleItem.protyleEl)
  unbindProtyleItem(protyleItem)
}

export const recordProtyleItem = (protyleItem: IProtyleObserverItem) => {
  protyleList.value.push(protyleItem)
}

export const recordProtyleItemByProtyle = (protyle: IProtyle) => {
  const protyleEl = protyle.element

  const existRef = existInProtyleList(protyleEl)
  if (existRef) {
    // 如果已经记录，先将当前记录删除，后续再另外新增
    removeProtyleItem(existRef)
  }

  const {
    isDailyNote,
    dailyNoteValues,
  } = getDailyNoteInfoByProtyleContentEl(protyle.contentElement)

  const dialog = protyle.contentElement.closest('.block__popover') as HTMLElement

  const protyleItem: IProtyleObserverItem = {
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
  }
  recordProtyleItem(protyleItem)
  return protyleItem
}

export const unbindProtyleItem = (protyleItem: IProtyleObserverItem) => {
  Object.keys(protyleItem).forEach((key) => {
    protyleItem[key] = null
  })
}

export const unbindAllProtyleItem = () => {
  protyleList.value.forEach((item) => {
    unbindProtyleItem(item)
  })
  protyleList.value = []
}

export const removeFromProtyleList = (protyleElement: HTMLElement) => {
  protyleList.value = protyleList.value.filter((item) => {
    const isTarget = item.protyleEl === protyleElement
    if (isTarget) {
      unbindProtyleItem(item)
    }
    return !isTarget
  })
}
