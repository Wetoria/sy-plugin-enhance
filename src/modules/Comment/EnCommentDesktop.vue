<template>
  <div>
    <a-modal
      v-model:visible="popoverVisible"
      class="enCommentContainerModal enCommentContainerModalDesktop"
      modal-class="enCommentContainer"
      draggable
      :footer="false"
      :mask="false"
      :alignCenter="false"
    >
      <template #title>
        <div
          class="row flexAlignCenter"
          style="width: 100%;"
        >
          <div>
            <EnBlockAppendModeSelector
              v-model="selectedNotebookId"
              v-model:targetId="targetId"
              :notebookList="openedNotebookList"
              :mode="globalData.commentMode"
              showPrompt
              showTips
            >
              <template
                v-if="isConfigValid"
                #tipIcon
              >
                <icon-check-circle style="color: rgb(var(--success-6))" />
              </template>
              <template #prompt>
                <div class="flexAlignCenter">
                  添加评论
                </div>
                <a-divider direction="vertical" />
              </template>
            </EnBlockAppendModeSelector>
          </div>
        </div>
      </template>
      <div
        class="enCommentContainerContent"
      >
        <a-spin
          dot
          :loading="isCommenting"
        >
          <EnProtyle
            :blockId="currentBlockId"
            :options="{
              action: [],
            }"
            @after-render="onAfterRender"
          />
        </a-spin>
      </div>
    </a-modal>
    <a-button
      v-show="commentButtonIsShown"
      class="enCommentButton"
      :style="{
        top: `${commentButtonPosition.y}px`,
        left: `${commentButtonPosition.x}px`,
      }"
      @click="onClickCommentButton"
      @mouseenter="onMouseEnterCommentButton"
    >
      <template #icon>
        <icon-plus />
      </template>
    </a-button>
  </div>
</template>

<script setup lang="ts">
import type { Protyle } from 'siyuan'
import {
  deleteBlock,
  flushTransactions,
  getBlockAttrs,
  setBlockAttrs,
  sql,
} from '@/api'
import EnBlockAppendModeSelector from '@/components/EnBlockAppendModeSelector.vue'
import EnProtyle from '@/components/EnProtyle.vue'
import {
  getCommentIdByNodeId,
} from '@/modules/Comment/Comment'
import {
  appendBlockIntoDailyNote,
} from '@/modules/DailyNote/DailyNote'
import {
  injectGlobalData,
  useModule,
} from '@/modules/EnModuleControl/ModuleProvide'
import {
  debounce,
} from '@/utils'
import { isAppendDailyNoteMode } from '@/utils/Block'
import {
  addCommandInModule,
} from '@/utils/Commands'
import {
  EN_COMMAND_KEYS,
  EN_CONSTANTS,
  EN_MODULE_LIST,
} from '@/utils/Constants'
import {
  getSelectionCopy,
  positionModalWithTranslate,
  targetIsInnerOf,
  targetIsOutsideOf,
} from '@/utils/DOM'
import {
  useSiyuanDatabaseIndexCommit,
} from '@/utils/EventBusHooks'
import { getColorStringWarn } from '@/utils/Log'
import { useMousePostion } from '@/utils/Mouse'
import {
  getClosetSiyuanNodeByDom,
  SyDomNodeTypes,
  useCurrentProtyle,
} from '@/utils/Siyuan'
import dayjs from 'dayjs'
import { showMessage } from 'siyuan'
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  watchEffect,
} from 'vue'

const currentProtyle = useCurrentProtyle()


const globalData = injectGlobalData()
const openedNotebookList = computed(() => globalData.value.openedNotebookList)


const {
  moduleOptions,
} = useModule<EnModuleComment>(EN_MODULE_LIST.COMMENT)
const dailyNoteNotebookId = computed(() => moduleOptions.value.notebookId)
const selectedNotebookId = ref(moduleOptions.value.notebookId)
const targetId = ref(moduleOptions.value.targetId)
watch(() => moduleOptions.value.notebookId, () => {
  selectedNotebookId.value = moduleOptions.value.notebookId
})
watch(() => moduleOptions.value.targetId, () => {
  targetId.value = moduleOptions.value.targetId
})
const isConfigValid = computed(() => {
  return isAppendDailyNoteMode(selectedNotebookId.value) || targetId.value
})



// #region 注册 selectionchange 事件

const selectionCopy = ref<Record<string, any>>({})
const watchSelectionChange = () => {
  selectionCopy.value = getSelectionCopy()
  showCommentButton()
}

onMounted(() => {
  document.addEventListener('selectionchange', watchSelectionChange)
})
onBeforeUnmount(() => {
  document.removeEventListener('selectionchange', watchSelectionChange)
})

// #endregion 注册 selectionchange 事件






const messageFlag = ref(null)
const stopMessage = () => {
  if (messageFlag.value) {
    clearTimeout(messageFlag.value)
    messageFlag.value = null
  }
}

// #region protyle 控制逻辑相关

const currentBlockId = ref()

const onAfterRender = (protyle: Protyle) => {
  protyle.protyle.element.classList.toggle('EnDisableProtyleEnhance', true)
  protyle.protyle.contentElement.classList.toggle('EnDisableProtyleEnhance', true)
  const flag = setInterval(() => {
    const target = protyle.protyle.contentElement.querySelector(`[data-node-id="${currentBlockId.value}"]`)

    if (target) {
      clearInterval(flag)

      // eslint-disable-next-line ts/no-use-before-define
      adjustCommentModal()


      protyle.focusBlock(target, true)

      // eslint-disable-next-line ts/no-use-before-define
      isCommenting.value = false
      stopMessage()
    }
  }, 0)
}

const destoryProtyle = () => {
  currentBlockId.value = ''
}

// #endregion protyle 控制逻辑相关

// #region 评论 modal 窗口

const popoverVisible = ref(false)
const showCommentModal = () => {
  popoverVisible.value = true
}
const hideCommentModal = () => {
  popoverVisible.value = false
  doNotShowCommentButton = true
}

// #region 双击关闭评论窗口

const isInCommentModal = (target: HTMLElement) => {
  let targetElement = target
  while (targetElement) {
    if (targetElement.classList.contains('enCommentContainerModal')) {
      return true
    }
    targetElement = targetElement.parentElement
  }
  return false
}

const closeModalOutside = (event: Event) => {
  if (!isInCommentModal(event.target as HTMLElement)) {
    hideCommentModal()
  }
}

const closeModalByEsc = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    event.stopImmediatePropagation()
    hideCommentModal()
  }
}

// #endregion 双击关闭评论窗口

watchEffect(() => {
  if (popoverVisible.value) {
    document.addEventListener('dblclick', closeModalOutside)
    document.addEventListener('keydown', closeModalByEsc, true)
    // 隐藏评论按钮
    hideCommentButton()
  } else {
    document.removeEventListener('dblclick', closeModalOutside)
    document.removeEventListener('keydown', closeModalByEsc, true)
    // 关闭弹窗时，销毁 protyle
    destoryProtyle()
  }
})

const adjustModalTargetRef = ref<HTMLElement>(null)
const recordAdjustCommentModalTargetElement = (element: HTMLElement) => {
  adjustModalTargetRef.value = element
}

const adjustCommentModal = () => {
  const modal = document.querySelector('.enCommentContainerModal .enCommentContainer') as HTMLDivElement
  if (!modal) {
    return
  }

  modal.style.transform = `translate(${window.innerWidth}px, ${window.innerHeight}px)`
  const {
    translateX,
    translateY,
  } = positionModalWithTranslate(adjustModalTargetRef.value, modal)
  const posY = translateY <= 32 ? 32 : translateY
  modal.style.transform = `translate(${translateX}px, ${posY}px)`
}

// #endregion 评论 modal 窗口


// #region 评论的业务逻辑相关



const lastCommentParams = ref({
  commentId: '',
  text: '',
})

watch(dailyNoteNotebookId, async () => {
  if (popoverVisible.value) {
    if (currentBlockId.value) {
      // IMP 最好是移动，而不是删除以后再新建
      await deleteBlock(currentBlockId.value)
      createCommentIntoDailyNote(lastCommentParams.value.commentId, lastCommentParams.value.text)
    }
  }
})

// 根据 commentId 和文本在思源中创建评论，获取到新的评论 nodeId，用来在 protyle 中展示
const newCommentNodeIdRef = ref()

const createCommentIntoDailyNote = async (commentId: string, text: string) => {
  try {
    const res = await appendBlockIntoDailyNote(
      'markdown',
      text,
      dailyNoteNotebookId.value,
    )

    const {
      doOperations = [],
    } = res[0]
    const transaction = doOperations[0]
    const {
      id,
      data,
    } = transaction

    let tempDom = document.createElement('div')
    tempDom.innerHTML = data

    tempDom = tempDom.firstElementChild as HTMLDivElement
    const listItemNode = tempDom.firstElementChild as HTMLDivElement
    const isListItemNode = listItemNode?.dataset.type === SyDomNodeTypes.NodeListItem

    if (!isListItemNode) {
      enWarn('Get List Item Node id Failed.')
    }

    const newCommentNodeId = isListItemNode ? listItemNode.dataset.nodeId : id
    await setBlockAttrs(newCommentNodeId, {
      'custom-en-comment-ref-id': commentId,
    })

    lastCommentParams.value = {
      commentId,
      text,
    }

    newCommentNodeIdRef.value = newCommentNodeId
    showCommentModal()
  } catch (error) {
    stopMessage()
  }
}

const commentByConfig = async (config: {
  commentId: string
  nodeId: string
  blockContent: string
  blockMarkdown: string
}) => {
  const {
    commentId,
    nodeId,
    blockContent,
    blockMarkdown,
  } = config
  const wrapMode = moduleOptions.value.commentWrapMode
  const isNodeListMode = wrapMode === 'NodeList'
  const structure = moduleOptions.value.customCommentStructure

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
    result = `- ${result}`.replace(/\n\n {4}>/g, '\n    >')
  } else {
    const temp = result.split('\n')
    result = temp.map((i) => {
      return i
    }).join('\n\n')
    result = `{{{row\n${result}`.replace(/\n\n>/g, '\n>')
  }

  return commentByCommentIdAndText(commentId, result)
}

const commentByCommentIdAndText = async (commentId: string, text: string) => {
  const mdText = text
  await createCommentIntoDailyNote(commentId, mdText)
}

// 当有新的评论 nodeId 时，更新当前的 blockId
// 即使评论窗口关闭着，也让它渲染着
watchEffect(() => {
  if (newCommentNodeIdRef.value) {
    currentBlockId.value = newCommentNodeIdRef.value
    newCommentNodeIdRef.value = ''
  }
})

const isCommenting = ref(false)
const startComment = async () => {
  isCommenting.value = true

  const protyle = currentProtyle.value
  const selectedNodes = Array.from(protyle.contentElement.querySelectorAll('.protyle-wysiwyg--select'))

  if (!popoverVisible.value) {
    messageFlag.value = setTimeout(() => {
      showMessage('创建评论中，请等待窗口自动显示', 3000)
    }, 1000)
  }

  if (selectedNodes.length === 0) {
    // 防止 selection 更新不及时
    const selection = window.getSelection()
    const siyuanNode = getClosetSiyuanNodeByDom(selection.focusNode as HTMLElement)

    if (!siyuanNode) {
      enWarn('siyuanNode was not found')
      return
    }
    // 如果未选择行内文字，则对单个块（段落块）进行评论
    if (selectionCopy.value.isCollapsed) {
      const nodeId = siyuanNode.dataset.nodeId
      commentForSingleBlockByNodeId(nodeId, siyuanNode)
      return
    }
    commentForInlineText()
    return
  }

  // 如果选中了 1 个 Block
  if (selectedNodes.length === 1) {
    const block = selectedNodes[0] as HTMLElement
    commentForSingleBlockByNodeId(block.dataset.nodeId, block)
    return
  }


  // 如果选中多个块
  let isSameParent = true
  const parentNode = selectedNodes[0].parentElement
  for (let i = 1; i < selectedNodes.length; i++) {
    if (selectedNodes[i].parentElement !== parentNode) {
      isSameParent = false
      break
    }
  }

  const allChildren = Array.from(parentNode.childNodes).filter((i: HTMLElement) => 'dataset' in i && 'nodeId' in i.dataset && i.dataset.nodeId)
  const isNotSelectedAllSiyuanChildNodes = allChildren.length !== selectedNodes.length
  const parentNodeIsWysiwyg = parentNode.classList.contains('protyle-wysiwyg')

  // 需要合并成超级块
  if (isSameParent && (parentNodeIsWysiwyg || isNotSelectedAllSiyuanChildNodes)) {
    convertIntoSuperBlockAndComment(selectedNodes as HTMLElement[])
  } else {
    // 对单一的块进行评论
    commentForSingleBlockByNodeId(parentNode.dataset.nodeId, parentNode)
  }
}


// #endregion 评论的业务逻辑相关



// 将多个块转换为超级块，然后对超级块进行备注
const convertIntoSuperBlockAndComment = async (selectedNodes: HTMLElement[]) => {
  const protyle = currentProtyle.value
  const protyleIns = protyle.getInstance()

  const firstNode = selectedNodes[0] as HTMLElement

  protyleIns.turnIntoOneTransaction(selectedNodes, 'BlocksMergeSuperBlock', 'row')
  let firstNodeParent = firstNode.parentElement
  const startTime = dayjs()
  while (firstNodeParent && firstNodeParent.dataset.type !== 'NodeSuperBlock') {
    firstNodeParent = firstNodeParent.parentElement
    const now = dayjs()
    if (now.diff(startTime, 'minute') > 1) {
      break
    }
  }
  if (!firstNodeParent) {
    enWarn('firstNodeParent is incorrect.')
    return
  }
  const superBlock = firstNodeParent as HTMLElement
  const superBlockId = superBlock.dataset.nodeId

  enLog('Convert into super block.')
  enLog('Ready to flush transactions.')
  await flushTransactions()
  enLog('Flush done. Ready to comment for single block.')
  const off = useSiyuanDatabaseIndexCommit(debounce(async () => {
    enLog(`${getColorStringWarn(`Ready to comment for super block.`)}`)
    off()
    await commentForSingleBlockByNodeId(superBlockId, superBlock)
  }, 20))
}

// 对单个块进行评论
const commentForSingleBlockByNodeId = async (nodeId: string, adjustTarget: HTMLElement) => {
  const sqlStmt = `select * from blocks where id = '${nodeId}'`
  const mdRes = await sql(sqlStmt) as any[]

  const blockMarkdown = mdRes[0]?.markdown
  const blockContent = mdRes[0]?.content
  if (!blockMarkdown) {
    enWarn('md is null')
    return
  }

  const blockAttrs = await getBlockAttrs(nodeId)
  const currentBlockCommentIdAttr = blockAttrs['custom-en-comment-id']
  let currentBlockCommentIdList = currentBlockCommentIdAttr ? currentBlockCommentIdAttr.split(' ') : []

  const currentBlockCommentId = currentBlockCommentIdList.length
    ? (currentBlockCommentIdList.find((cId) => cId.includes(nodeId)) || getCommentIdByNodeId(nodeId))
    : getCommentIdByNodeId(nodeId)

  currentBlockCommentIdList.push(currentBlockCommentId)
  currentBlockCommentIdList = Array.from(new Set(currentBlockCommentIdList))
  await setBlockAttrs(nodeId, {
    'custom-en-comment-id': currentBlockCommentIdList.join(' '),
  })


  await commentByConfig({
    commentId: currentBlockCommentId,
    nodeId,
    blockContent,
    blockMarkdown,
  })

  if (adjustTarget) {
    recordAdjustCommentModalTargetElement(adjustTarget)
  }
}

const commentForInlineText = async () => {
  const protyle = currentProtyle.value

  const selection = window.getSelection()

  const {
    focusNode,
  } = selection
  const siyuanNode = getClosetSiyuanNodeByDom(focusNode as HTMLElement)
  const nodeId = siyuanNode.dataset.nodeId
  const contentEditableDiv = siyuanNode.firstElementChild
  const isReadonly = contentEditableDiv.getAttribute('contenteditable') === 'false'

  if (isReadonly) {
    contentEditableDiv.setAttribute('contenteditable', 'true')
  }
  // 获取临时注释元素
  protyle.toolbar?.setInlineMark(protyle, 'en-comment-temp', 'range')

  const commentElements = document.querySelectorAll('[data-type~="en-comment-temp"]') as NodeListOf<Element>

  // 先查看选择的所有区域，是否有相同的 commentId
  // 如果有，看是不是还有余下的。

  const idList = []
  for (let i = 0; i < commentElements.length; i++) {
    const commentElement = commentElements[i] as HTMLElement
    const nodeTypes = commentElement.dataset.type.split(/\s+/)
    idList.push(nodeTypes.filter((i) => i.startsWith('en-comment-id-')))
  }

  const findCommonIDs = (arrays) => {
    const [first, ...rest] = arrays
    return first.filter((id) => rest.every((arr) => arr.includes(id)))
  }

  const commonIDs = findCommonIDs(idList)

  const notSubOfParentIdList = []
  const sameId = commonIDs.find((id) => {
    if (!id.includes(nodeId)) {
      notSubOfParentIdList.push(id)
      return false
    }
    const targets = siyuanNode.querySelectorAll(`[data-type~="${id}"]`)
    return targets.length === commentElements.length
  })

  // 拼接选中区域的文本用来作为备注的引用内容
  let selectText = ''
  for (let i = 0; i < commentElements.length; i++) {
    const commentElement = commentElements[i] as HTMLElement
    selectText += commentElement.innerText
  }

  protyle?.toolbar?.setInlineMark(protyle, 'en-comment-temp', 'range')

  const enCommentId = sameId || getCommentIdByNodeId(nodeId)

  await commentByConfig({
    commentId: enCommentId,
    nodeId,
    blockContent: selectText,
    blockMarkdown: selectText,
  })
  // await commentByCommentIdAndText(enCommentId, `((${nodeId} "${selectText}"))`)
  // 清理临时标记

  // 清理非子节点的标记（比如复制出来的情况）
  notSubOfParentIdList.forEach((notSubOfParentId) => {
    protyle?.toolbar?.setInlineMark(protyle, notSubOfParentId, 'range')
  })

  if (!sameId) {
    // 如果没有相同的 id，增新增 id 标记
    protyle?.toolbar?.setInlineMark(protyle, enCommentId, 'range')
  }

  const firstComment = document.querySelector(`[data-type~="${enCommentId}"]`)
  if (firstComment) {
    recordAdjustCommentModalTargetElement(firstComment as HTMLElement)
  }
  if (isReadonly) {
    contentEditableDiv.setAttribute('contenteditable', 'false')
  }
}

// #region 显示评论按钮相关

const commentButtonIsShown = ref(false)
let commentButtonIsShowing = false
let doNotShowCommentButton = false
const showCommentButton = debounce(() => {
  commentButtonIsShowing = true
  commentButtonIsShown.value = true

  setTimeout(() => {
    commentButtonIsShowing = false
  }, 500)
}, 100)
const hideCommentButton = () => {
  if (commentButtonIsShowing) {
    commentButtonIsShowing = false
    return
  }
  commentButtonIsShown.value = false
}

const commentButtonPosition = ref({
  x: window.innerWidth,
  y: window.innerHeight,
})
const isInCommentButton = (target: HTMLElement) => {
  return targetIsInnerOf(target, (i) => i.classList.contains('enCommentButton'))
}

const readyToHideCommentButtonFlag = ref(null)
const stopReadyToHideCommentButton = () => {
  if (readyToHideCommentButtonFlag.value) {
    clearTimeout(readyToHideCommentButtonFlag.value)
    readyToHideCommentButtonFlag.value = null
  }
}

// 鼠标按下时，如果不在评论按钮上，则隐藏评论按钮
const watchMouseDown = (event: Event) => {
  stopReadyToHideCommentButton()
  if (!isInCommentButton(event.target as HTMLElement)) {
    hideCommentButton()
  }
}

// 点击以后，显示评论按钮
const watchMouseUp = debounce((event: Event) => {
  if (doNotShowCommentButton) {
    doNotShowCommentButton = false
    return
  }
  const {
    target,
  } = event as MouseEvent
  // 点击评论按钮，跳过显示逻辑
  if (isInCommentButton(target as HTMLElement)) {
    return
  }
  // 点击 protyle 时，才显示评论按钮
  if (targetIsOutsideOf(target as HTMLElement, (i) => i.classList.contains('protyle-wysiwyg'))) {
    return
  }

  setTimeout(() => {
    // 延时获取鼠标当前位置，防止鼠标移动过快，导致位置获取不准确
    stopReadyToHideCommentButton()
    commentButtonPosition.value = {
      // eslint-disable-next-line ts/no-use-before-define
      x: getCurrentMousePosition().clientX,
      // eslint-disable-next-line ts/no-use-before-define
      y: getCurrentMousePosition().clientY + 25,
    }

    // 修正顶部位置，防止被顶部工具栏遮挡按钮
    if (commentButtonPosition.value.y < 32) {
      commentButtonPosition.value.y = 32
    }
    showCommentButton()
  }, 200)
}, 200)


const {
  eventBinded,
  bindEvent,
  unbindEvent,
  getCurrentMousePosition,
} = useMousePostion({
  immediate: false,
  onMouseUp: watchMouseUp,
  onMouseDown: watchMouseDown,
  onMouseMoveStart() {
    if (commentButtonIsShown.value) {
      readyToHideCommentButtonFlag.value = setTimeout(() => {
        hideCommentButton()
      }, 500)
    }
  },
})

addCommandInModule({
  langKey: EN_COMMAND_KEYS.EN_COMMENT_ENABLE_BTN,
  langText: EN_CONSTANTS.COMMENT_ENABLE_BTN_DISPLAY,
  hotkey: '',
  callback: () => {
    if (eventBinded.value) {
      hideCommentButton()
      unbindEvent()
      showMessage('叶归｜批注功能已关闭', 1000)
    } else {
      bindEvent()
      showMessage('叶归｜批注功能已开启', 1000)
    }
  },
})

const onClickCommentButton = () => {
  hideCommentButton()
  startComment()
}
const onMouseEnterCommentButton = () => {
  stopReadyToHideCommentButton()
}

// #endregion 显示评论按钮相关


// #region 插件快捷键相关

addCommandInModule({
  langKey: EN_COMMAND_KEYS.EN_COMMENT_CURRENT_CONTENT,
  langText: EN_CONSTANTS.COMMENT_CURRENT_CONTENT_DISPLAY,
  hotkey: '',
  editorCallback: () => {
    if (popoverVisible.value) {
      hideCommentModal()
    } else {
      startComment()
    }
  },
})

const onClickCommentUsageLinkBtn = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  if (target.classList.contains('enCommentUsageLinkBtn')) {
    event.stopImmediatePropagation()
  }
}
onMounted(() => {
  document.addEventListener('click', onClickCommentUsageLinkBtn, true)
})
onBeforeUnmount(() => {
  document.removeEventListener('click', onClickCommentUsageLinkBtn, true)
})

// #endregion 插件快捷键相关



</script>

<style lang="scss">
.enCommentContainerModalDesktop {
  pointer-events: none;

  & .arco-modal-wrapper {
    pointer-events: none;
    text-align: unset;
    overflow: hidden;
  }

  .enCommentContainer {
    pointer-events: auto;
    top: 0;
    vertical-align: top;
    min-height: 98px;
    max-width: 45vw;
    background: var(--b3-theme-background);
    border: 1px solid var(--b3-border-color);
    transform: translate(100vw, 100vh);

    .arco-modal-header {
      padding: 0 16px;
      border-bottom: 1px solid var(--b3-border-color);
      height: 36px;
    }

    .arco-modal-body {
      padding: 0;
    }

    .enCommentContainerContent {
      display: flex;
      flex-direction: column;
      flex: 1;
      overflow: auto;

      .protyle-content {
        padding-bottom: unset !important;
      }

      .protyle-wysiwyg {
        padding: 6px 16px !important;
      }

      .enCommentContainerContentHistoryCommentList {
        display: flex;
        flex-direction: column;
        // gap: var(--en-gap);

        .historyCommentList {
          display: flex;
          flex-direction: column;
          // gap: var(--en-gap);

          max-height: 20vh;
          overflow: hidden;
          overflow-y: auto;

          .protyle-content {
            padding-bottom: unset !important;
          }
        }
      }
    }
  }
}

.arco-btn.enCommentButton {
  position: fixed;
  pointer-events: auto;
  background: var(--b3-theme-background);
  z-index: 1000;
  border: 1px solid var(--b3-border-color);

  &:hover {
    background: var(--b3-theme-background);
    border: 1px solid var(--b3-theme-on-background);
  }
}
</style>
