import { performSync } from '@/api'
import { usePlugin } from '@/main'
import { debounce } from '@/utils'
import { useSiyuanEventTransactions } from '@/utils/EventBusHooks'
import {
  getAllModels,
  IOperation,
  IProtyle,
} from 'siyuan'
import {
  onMounted,
  onUnmounted,
  ref,
} from 'vue'
import { queryAllByDom } from './DOM'

export const SiyuanSelectClassName = 'protyle-wysiwyg--select'

export enum SyFrontendTypes {
  // 桌面端
  'desktop' = 'desktop',
  'desktop-window' = 'desktop-window',
  // 移动端
  'mobile' = 'mobile',
  // 浏览器 - 桌面端
  'browser-desktop' = 'browser-desktop',
  // 浏览器 - 移动端
  'browser-mobile' = 'browser-mobile',
}

export enum SyDomNodeTypes {
  NodeDocument = 'NodeDocument',

  NodeParagraph = 'NodeParagraph',
  NodeHeading = 'NodeHeading',
  NodeTable = 'NodeTable',

  NodeList = 'NodeList',
  NodeListItem = 'NodeListItem',
  NodeBlockquote = 'NodeBlockquote',
  NodeSuperBlock = 'NodeSuperBlock',

  NodeAudio = 'NodeAudio',
  NodeVideo = 'NodeVideo',

  BreadCrumb = 'protyle-breadcrumb__bar',
}

export enum SyHelperClasses {
  GUTTERS = 'protyle-gutters',
  SELECT = 'protyle-select',
  TOOLBAR = 'protyle-toolbar',
  HINT = 'protyle-hint',
}

export const hideHelperByTarget = (target: HTMLElement) => {
  if (!target) {
    return
  }
  const helperClasses = [
    SyHelperClasses.GUTTERS,
    SyHelperClasses.SELECT,
    SyHelperClasses.TOOLBAR,
    SyHelperClasses.HINT,
  ]
  helperClasses.forEach((className) => {
    target.querySelectorAll(`.${className}`).forEach((item) => {
      item.classList.add('fn__none')
    })
  })
}

export const defaultToolbar = [
  "block-ref",
  "a",
  "|",
  "text",
  "strong",
  "em",
  "u",
  "s",
  "mark",
  "sup",
  "sub",
  "clear",
  "|",
  "code",
  "kbd",
  "tag",
  "inline-math",
  "inline-memo",
]

export function getSyDomNodeType(node: HTMLElement) {
  return node.dataset.type as SyDomNodeTypes
}
export function getSyDomNodeSubType(node: HTMLElement) {
  return node.dataset.subtype
}

export function isSyNodeParagraphDom(node: HTMLElement) {
  return getSyDomNodeType(node) === SyDomNodeTypes.NodeParagraph
}

export function isSyNodeListDom(node: HTMLElement) {
  return getSyDomNodeType(node) === SyDomNodeTypes.NodeList
}

export function isSyNodeListItemDom(node: HTMLElement) {
  return getSyDomNodeType(node) === SyDomNodeTypes.NodeListItem
}

export function isSyNodeHeadingDom(node: HTMLElement) {
  return getSyDomNodeType(node) === SyDomNodeTypes.NodeHeading
}

export function isSyNodeTableDom(node: HTMLElement) {
  return getSyDomNodeType(node) === SyDomNodeTypes.NodeTable
}

export function isSyNodeBlockquoteDom(node: HTMLElement) {
  return getSyDomNodeType(node) === SyDomNodeTypes.NodeBlockquote
}
export function isSyNodeSuperBlockDom(node: HTMLElement) {
  return getSyDomNodeType(node) === SyDomNodeTypes.NodeSuperBlock
}

export function isSyBreadCrumbDom(node: HTMLElement) {
  return node.classList.contains(SyDomNodeTypes.BreadCrumb)
}

export function hideDom(dom: HTMLElement) {
  dom.classList.toggle('fn__none', true)
}
export function showDom(dom: HTMLElement) {
  dom.classList.toggle('fn__none', false)
}

export function getBlockRefNodes(node: HTMLElement) {
  return queryAllByDom(node, '[data-type="block-ref"]')
}

export function checkNodeHasBlockRef(node: HTMLElement, compare: (id: string) => boolean): boolean {
  if (!node) {
    return false
  }
  const blockRefDoms = getBlockRefNodes(node)
  if (!blockRefDoms.length) {
    return false
  }

  return blockRefDoms.some((item: HTMLElement) => {
    return compare(item.dataset.id)
  })
}

export function getSyHeadingNodeType(node: HTMLElement) {
  return getSyDomNodeSubType(node)
}

export function getChildNodeList(node: HTMLElement) {
  return node.querySelector(`[data-type="${SyDomNodeTypes.NodeList}"]`)
}

export const isBlockRef = (node) => ['doc', 'block_Ref'].includes(node._type)

export const getParentNode = (list, node) => {
  return list.find((i) => i.id === node.parent_id)
}



enum SyNodeTypes {
  h = 'h',
  c = 'c',
  m = 'm',
  t = 't',
  p = 'p',
  html = 'html',

  d = 'd',
  l = 'l',
  i = 'i',
  b = 'b',
  s = 's',
}

export function getSyNodeType(node) {
  return node.type
}
export function getSyNodeSubType(node) {
  return node.subtype
}

export function isSyHeadingNode(node) {
  return getSyNodeType(node) === SyNodeTypes.h
}

export function isSyCodeNode(node) {
  return getSyNodeType(node) === SyNodeTypes.c
}

export function isSyMathNode(node) {
  return getSyNodeType(node) === SyNodeTypes.m
}

export function isSyTableNode(node) {
  return getSyNodeType(node) === SyNodeTypes.t
}
export function isSyParagraphNode(node) {
  return getSyNodeType(node) === SyNodeTypes.p
}

export function isSyNodeCanContainerBlockRef(node) {
  return isSyHeadingNode(node) || isSyTableNode(node) || isSyParagraphNode(node)
}


export function isSyDocNode(node) {
  return getSyNodeType(node) === SyNodeTypes.d
}

export function isSyListNode(node) {
  return getSyNodeType(node) === SyNodeTypes.l
}
export function isSyListItemNode(node) {
  return getSyNodeType(node) === SyNodeTypes.i
}
export function isSyQuoteNode(node) {
  return getSyNodeType(node) === SyNodeTypes.b
}
export function isSySuperBlockNode(node) {
  return getSyNodeType(node) === SyNodeTypes.s
}

export function isSyContainerNode(node) {
  return isSyDocNode(node) || isSyListNode(node) || isSyListItemNode(node) || isSyQuoteNode(node) || isSySuperBlockNode(node)
}


export function hasTargetBlockRef(markdown, defBlockId) {
  return markdown.includes(`((${defBlockId}`)
}
export function hasTargetBlockRefIdAndName(markdown, defBlockId, content) {
  const blockRefsInMarkdown = markdown.match(/\(\(.*?\)\)/g)
  if (!blockRefsInMarkdown) {
    return false
  }
  const hasBlockRef = !!blockRefsInMarkdown.find((item: string) => {
    const idTemp = `((${defBlockId}`
    const hasBlockRefId = item.startsWith(idTemp)
    if (!hasBlockRefId) {
      return false
    }
    let removedId = item.replace(idTemp, '').trim().substring(1)
    removedId = removedId.substring(0, removedId.length - 3)
    if (removedId !== content) {
      return false
    }
    return true
  })
  return hasBlockRef
}

export function chainHasTargetBlockRefIdAndName(chain, defBlockId, content?) {
  return chain.some((i) => hasTargetBlockRefIdAndName(i._markdown, defBlockId, content))
}

export function chainHasRefNode(chain, node) {
  if (node._type === 'doc') {
    return chain.some((i) => i.id === node.id)
  } else {
    return chainHasTargetBlockRefIdAndName(chain, node.id, node.name)
  }
}

export function getTreeChainPathOfDoc(chainList) {
  const chainPaths = []
  chainList.forEach((chain) => {
    let path = ''
    chain.forEach((chainNode, index) => {
      if (isSyParagraphNode(chainNode)) {
        const prevNode = chain[index - 1]
        if (prevNode && isSyContainerNode(prevNode)) {
          return
        }
      }
      path += `/((${chainNode.id} '${chainNode.name}'))|[${chainNode._markdown}]`
    })
    chainPaths.push(path)
  })
  return chainPaths
}

export interface EnhanceIOperation extends Pick<IOperation, 'action' | 'data' | 'id'> {
  text: string
  timestamp: number
  nodeType: '' | SyDomNodeTypes
}

function convertIOperationIntoDoOperation(data: IOperation, timestamp: number) {
  const result: EnhanceIOperation = {
    action: data.action,
    timestamp,
    id: data.id,
    text: '',
    data: data.data,
    nodeType: '',
  }
  if (data.data) {
    let dom = document.createElement('div')
    dom.innerHTML = data.data
    dom = dom.firstElementChild as HTMLDivElement
    if (!dom) {
      return result
    }

    result.nodeType = getSyDomNodeType(dom)

    const editDom = dom.firstElementChild
    result.text = editDom.textContent
  }
  return result
}

export function onEditorUpdate(
  callback: (operations: EnhanceIOperation[]) => void,
  time = 5000,
) {
  let doOperationList: EnhanceIOperation[] = []
  const debounceTime = time
  const run = debounce(() => {
    callback(doOperationList)
    doOperationList = []
  }, debounceTime)

  const offTransactions = useSiyuanEventTransactions(({ detail }) => {
    detail.data.forEach((item) => {
      const {
        doOperations,
        timestamp,
      } = item
      doOperations.forEach((doOperation) => {
        doOperationList.push(
          convertIOperationIntoDoOperation(doOperation, timestamp),
        )
      })
    })
    run()
  })
  const off = () => {
    run.cancel()
    offTransactions()
  }
  return off
}

export function getCreatedByDataset(id: string) {
  if (!id)
    return
  const createdStr = id.split('-')[0]
  return createdStr
}

const currentProtyle = ref<IProtyle>()
window.SEP_GLOBAL.currentProtyle = currentProtyle
let recorded = false

export function useCurrentProtyle() {
  const plugin = usePlugin()
  const recordCurrentProtyle = ({ detail }) => {
    currentProtyle.value = detail?.protyle
  }

  if (!recorded) {
    onMounted(() => {
      plugin.eventBus.on('click-editorcontent', recordCurrentProtyle)
    })
    onUnmounted(() => {
      plugin.eventBus.off('click-editorcontent', recordCurrentProtyle)
    })
    recorded = true
  }
  return currentProtyle
}

export function getClosetSiyuanNodeByDom(dom: HTMLElement) {
  let siyuanNode = dom as HTMLElement
  while (siyuanNode != null && !siyuanNode?.dataset?.nodeId) {
    siyuanNode = siyuanNode.parentElement
  }
  return siyuanNode
}


/**
 * 使用 protyle.element 进行判断
 */
export function isProtyleInEditor(element: HTMLElement) {
  const { editor } = getAllModels()
  return !!editor?.find((item: any) => item.element === element)
}


export const toggleSiyuanSync = debounce(() => {
  performSync()
}, 5000)
