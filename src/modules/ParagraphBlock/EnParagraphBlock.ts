import {
  injectLocal,
  provideLocal,
} from '@vueuse/core'
import {
  ref,
  Ref,
} from 'vue'

// 新的通用链接处理函数（包括纯链接和块引用）
export const provideParagraphLinks = (list: Ref<HTMLDivElement[]>) => {
  provideLocal('En_ParagraphLinks', list)
}

export const injectParagraphLinks = (): Ref<HTMLDivElement[]> => {
  const list = injectLocal('En_ParagraphLinks', ref([])) as Ref<HTMLDivElement[]>
  return list
}
