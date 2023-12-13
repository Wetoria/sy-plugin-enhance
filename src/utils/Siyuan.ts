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

export function isSyNodeParagraph(node: HTMLElement) {
  return getSyDomNodeType(node) === SyDomNodeTypes.NodeParagraph
}

export function isSyNodeList(node: HTMLElement) {
  return getSyDomNodeType(node) === SyDomNodeTypes.NodeList
}

export function isSyNodeListItem(node: HTMLElement) {
  return getSyDomNodeType(node) === SyDomNodeTypes.NodeListItem
}

export function isSyNodeHeading(node: HTMLElement) {
  return getSyDomNodeType(node) === SyDomNodeTypes.NodeHeading
}

export function isSyNodeTable(node: HTMLElement) {
  return getSyDomNodeType(node) === SyDomNodeTypes.NodeTable
}

export function isSyBreadCrumb(node: HTMLElement) {
  return node.classList.contains(SyDomNodeTypes.BreadCrumb)
}

export function isSyNodeBlockquote(node: HTMLElement) {
  return node.classList.contains(SyDomNodeTypes.NodeBlockquote)
}
export function isSyNodeSuperBlock(node: HTMLElement) {
  return node.classList.contains(SyDomNodeTypes.NodeSuperBlock)
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
