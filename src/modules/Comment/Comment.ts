import { EN_PROVIDE_KEYS } from '@/utils/Constants'
import {
  inject,
  provide,
  Ref,
  WritableComputedRef,
} from 'vue'

export function provideCommentOptions(commentOptions: WritableComputedRef<EnModuleComment>) {
  provide(EN_PROVIDE_KEYS.EN_COMMENT_OPTIONS, commentOptions)
}

export function injectCommentOptions(): WritableComputedRef<EnModuleComment> {
  return inject(EN_PROVIDE_KEYS.EN_COMMENT_OPTIONS) as WritableComputedRef<EnModuleComment>
}



export enum EN_COMMENT_KEYS {
  commentIdPrefix = 'en-comment-id',
  commentIdInAttribute = 'custom-en-comment-id',
  nodeCommentRefKey = 'custom-en-comment-ref-id',
}

export function provideCommentIdList(commentIdList: Ref<string[]>) {
  provide(EN_PROVIDE_KEYS.EN_COMMENT_ID_LIST, commentIdList)
}

export function injectCommentIdList(): Ref<string[]> {
  return inject(EN_PROVIDE_KEYS.EN_COMMENT_ID_LIST) as Ref<string[]>
}

// 根据 commentId 获取 nodeId
export const getNodeIdByCommentId = (commentId: string) => {
  const temp = commentId.split('-')
  temp.pop()
  const nodeId = [temp.pop(), temp.pop()].reverse().join('-')
  return nodeId
}
