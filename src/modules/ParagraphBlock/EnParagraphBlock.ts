import {
  injectLocal,
  provideLocal,
} from '@vueuse/core'
import {
  ref,
  Ref,
} from 'vue'

export const provideParagraphOnlyLink = (list: Ref<HTMLDivElement[]>) => {
  provideLocal('En_ParagraphOnlyLink', list)
}

export const injectParagraphOnlyLink = (): Ref<HTMLDivElement[]> => {
  const list = injectLocal('En_ParagraphOnlyLink', ref([])) as Ref<HTMLDivElement[]>
  return list
}
