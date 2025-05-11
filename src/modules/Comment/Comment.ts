import { generateShortUUID } from '@/utils'
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

export function provideCommentInfoList(commentInfoList: Ref<EnCommentInfo[]>) {
  provide('en-comment-info-list', commentInfoList)
}

export function injectCommentInfoList(): Ref<EnCommentInfo[]> {
  return inject('en-comment-info-list')
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

// 根据 nodeId 生成 commentId
export const getCommentIdByNodeId = (nodeId: string) => {
  const shortUUID = generateShortUUID()
  return `en-comment-id-${nodeId}-${shortUUID}`
}

export const isCommentNode = (target: HTMLElement) => {
  return target?.getAttribute('custom-en-comment-id') || target?.dataset?.type?.includes('en-comment-id')
}

export const isCancelShowCommentListDom = (target: HTMLElement) => {
  return target.classList.contains('enCancelShowCommentListDom')
}


export const getCommentMdByConfig = (config: {
  commentId: string
  nodeId: string
  blockContent: string
  blockMarkdown: string
  moduleOptions: EnModuleComment
}) => {
  const {
    commentId,
    nodeId,
    blockContent,
    blockMarkdown,
    moduleOptions,
  } = config
  const wrapMode = moduleOptions.commentWrapMode
  const isNodeListMode = wrapMode === 'NodeList'
  const structure = moduleOptions.customCommentStructure

  const createParser = (config = {}) => {
    const options = {
      startTag: '${',
      endTag: '}',
      paramSeparator: '|',
      argSeparator: ',',
      ...config,
    }

    const parse = (text) => {
      const regex = new RegExp(
        `\\${options.startTag}([^${options.endTag}]+)\\${options.endTag}`,
        'g',
      )

      return Array.from(text.matchAll(regex)).map((match: RegExpMatchArray) => {
        const [full, content] = match
        const [type, ...paramParts] = content.split(options.paramSeparator)
        const params = paramParts.join(options.paramSeparator)
          .split(options.argSeparator)
          .map((p) => p.trim())

        return {
          type: type.trim(),
          params,
          full,
          index: match.index,
        }
      })
    }

    const replace = (text, handlers) => {
      return text.replace(
        new RegExp(`\\${options.startTag}([^${options.endTag}]+)\\${options.endTag}`, 'g'),
        (match, content) => {
          const [type, ...paramParts] = content.split(options.paramSeparator)
          const params = paramParts.join(options.paramSeparator)
            .split(options.argSeparator)
            .map((p) => p.trim())

          const handler = handlers[type.trim()]
          return handler ? handler(...params) : match
        },
      )
    }

    return {
      parse,
      replace,
    }
  }

  // 使用示例
  const parser = createParser()

  const parsed = parser.parse(structure)

  const cleanInvisibleCharacters = (text) => {
    return text
      // 零宽字符
      .replace(/[\u200B-\u200F\uFEFF]/g, '')
      // 控制字符
      // eslint-disable-next-line no-control-regex
      .replace(/[\u0000-\u001F\u007F-\u009F]/g, '')
      // 连接符
      .replace(/[\u200C\u200D]/g, '')
      // 变异选择器
      .replace(/[\uFE00-\uFE0F]/g, '')
      // 组合字符
      .replace(/[\u0300-\u036F]/g, '')
      // 空格
      .replace(/\s+/g, ' ')
      // 其他不可见字符
      .replace(/[\u2000-\u200F\u2028-\u202F\u205F-\u206F]/g, '')
      // 修饰符
      .replace(/[\uDB40-\uDB43][\uDC00-\uDFFF]/g, '')
  }

  // 定义处理器
  const handlers = {
    ref: (value, maxLen) => {
      let result = blockContent
      const isTextValue = value === 'text'
      if (!value) {
        return `((${nodeId} ''))`
      } else if (isTextValue) {
        result = blockContent
      } else {
        result = value
      }

      result = result.replace(/"/g, '\\"').replace(/\)/g, '\\)')

      if (isTextValue && maxLen && result.length > maxLen) {
        result = `${result.slice(0, maxLen)}...`
      }
      return `((${nodeId} "${result}"))`
    },
    comment: () => `&ZeroWidthSpace;`,
    quote: (...params) => {
      const hasParams = params.length

      const needWrap = hasParams && params.find((i) => i === 'wrap')
      let newMarkdown = blockMarkdown

      const lines = blockMarkdown.replace(/^\{\{\{row(\s*)*/, '').replace(/(\s*)*\}\}\}$/, '').trim().split('\n')
      if (needWrap) {
        newMarkdown = lines.map((line) => {
          return `> ${line}`
        }).join('\n')
      }

      const needFold = hasParams && params.find((i) => i.startsWith('fold'))
      if (needFold) {
        const foldLineNum = needFold.split('-')[1] || 1
        const unblankLines = lines.filter((i) => i.trim())
        const isBiggerThan = unblankLines.length > foldLineNum
        if (isBiggerThan) {
          newMarkdown += `\n{: style="" fold="1" }`
        }
      }


      const refParsed = parsed.find((i) => i.type === 'ref')
      const refValue = refParsed?.params[0]
      const refMaxLen = refParsed?.params[1]

      if (!refParsed || !refValue) {
        return newMarkdown
      }

      if (refValue !== 'text' || blockContent.length > Number(refMaxLen)) {
        return newMarkdown
      }


      if (cleanInvisibleCharacters(blockContent) === cleanInvisibleCharacters(blockMarkdown)) {
        return ''
      }
      return newMarkdown
    },
  }


  let result = parser.replace(structure, handlers)

  if (isNodeListMode) {
    const temp = result.split('\n')
    result = temp.map((i) => {
      return i
    }).join('\n\n    ')
    result = `- {: style="" custom-en-comment-ref-id="${commentId}"}${result}`.replace(/\n\n {4}>/g, '\n    >')
  } else {
    const temp = result.split('\n')
    result = temp.map((i) => {
      return i
    }).join('\n\n')
    result = `{{{row\n${result}\n}}}\n{: style="" custom-en-comment-ref-id="${commentId}"}`.replace(/\n\n>/g, '\n>')
  }

  return result
}
