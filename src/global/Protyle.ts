import { usePlugin } from '@/main'
import { getAllModels } from 'siyuan'

export const isFlashCardProtyle = (protyleEl: HTMLElement) => {
  return protyleEl?.classList?.contains?.('card__block')
}

export const isEditorProtyle = (protyleEl: HTMLElement) => {
  const plugin = usePlugin()
  if (plugin.isMobile) {
    return protyleEl.id === 'editor'
  }
  const { editor: editorList } = getAllModels()
  const isEditorProtyle = editorList.some((item: any) => item.editor.protyle.element === protyleEl)
  return isEditorProtyle
}

export const getDailyNoteInfoByProtyleContentEl = (protyleContentEl: HTMLElement) => {
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
