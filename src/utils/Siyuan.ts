import { queryAllByDom } from './DOM'

export enum SyDomNodeTypes {
  NodeParagraph = 'NodeParagraph',
  NodeHeading = 'NodeHeading',
  NodeTable = 'NodeTable',

  NodeList = 'NodeList',
  NodeListItem = 'NodeListItem',
  NodeBlockquote = 'NodeBlockquote',
  NodeSuperBlock = 'NodeSuperBlock',

  BreadCrumb = 'protyle-breadcrumb__bar',
}

export function getSyDomNodeType(node: HTMLElement) {
  return node.dataset.type
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
  return list.find(i => i.id === node.parent_id)
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

export function chainHasTargetBlockRefId(chain, defBlockId) {
  return chain.some(i => hasTargetBlockRef(i._markdown, defBlockId))
}

export function chainHasRefNode(chain, node) {
  if (node._type === 'doc') {
    return chain.some(i => i.id === node.id)
  } else {
    return chainHasTargetBlockRefId(chain, node.id)
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
      path += `/${chainNode.id}|[${chainNode._markdown}]`
    })
    chainPaths.push(path)
  })
  return chainPaths
}
