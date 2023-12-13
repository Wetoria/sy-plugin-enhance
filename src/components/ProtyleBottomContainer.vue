<template>
  <div class="ProtyleBottomContainer">
    <div class="enhanceToBottomIndicator" :data-node-id="protyle.block.id"></div>
    <div class="backlinkArea">
      <div
        class="backlinkAreaTitleLine"
      >
        <div
          class="backlinkAreaFolder"
          @click="switchBacklinkAreaFoldStatus"
          :style="{
            transform: `rotateZ(${backlinkAreaFolded ? '0' : '90'}deg)`,
          }"
        >
          <SyIcon
            name="iconPlay"
            size="10"
          />
        </div>
        <h2
          class="backlinkTitle"
          @click="switchBacklinkAreaFoldStatus"
        >
          反链
        </h2>
        <div class="opts">
          <SyIcon
            @click="switchBacklinkFilterPanelShownStatus"
            name="iconFilter"
            size="14"
          />
        </div>

      </div>
      <div
        class="backlinkFilterContainer"
        :style="{
          display: backlinkFilterPanelShownStatus ? 'flex' : 'none',
        }"
      >
        <div>
          <h3>搜索/过滤</h3>
        </div>
        <div>
          单击左键来包含，或则 shift-单击左键来排除，再次点击取消选中。
        </div>
        <div class="backlinkRefListContainer" v-if="includeRefs.length">
          include:
          <div
            v-for="item of includeRefs"
            :key="'in-' + item.id"
            style="
              display: flex;
              justify-content: center;
              align-items: center;
              padding: 2px 8px;
              border: 1px solid black;
              border-radius: 6px;
              cursor: pointer;
              height: 20px;
            "
            @click="(event) => handleClickFilterTag(event, item)"
          >
            {{ item.name }}
          </div>
        </div>
        <div class="backlinkRefListContainer" v-if="excludeRefs.length">
          exclude:
          <div
            v-for="item of excludeRefs"
            :key="'ex-' + item.id"
            style="
              display: flex;
              justify-content: center;
              align-items: center;
              padding: 2px 8px;
              border: 1px solid black;
              border-radius: 6px;
              cursor: pointer;
              height: 20px;
            "
            @click="(event) => handleClickFilterTag(event, item)"
          >
            {{ item.name }}
          </div>
        </div>
        <div class="backlinkRefListContainer">
          <div
            v-for="item of unionRefLinks"
            :key="item.id"
            style="
              display: flex;
              justify-content: center;
              align-items: center;
              padding: 2px 8px;
              border: 1px solid black;
              border-radius: 6px;
              cursor: pointer;
              height: 20px;
            "
            @click="(event) => handleClickFilterTag(event, item)"
          >
            {{ item.name }}
            <sup
              style="
                margin-left: 2px
              "
            >
              {{ item.links.length }}
            </sup>
          </div>
        </div>
      </div>
      <div
        :style="{
          height: backlinkAreaFolded ? '0px' : 'max-content',
          overflow: 'hidden',
        }"
      >
        <div v-if="!docBacklinks.length">
          未找到相关内容
        </div>
        <template v-else-if="!useV">
          <div
            class="vBacklinkContainer backlinkList"
            ref="backlinkListRef"
          >
            <ul class="b3-list b3-list--background">
              <div
                v-for="docBacklink of docBacklinks"
                :key="docBacklink.id"
                class="backlinkDocBlock"
              >
                <BacklinkBlock
                  :backlink-data="(blockBackLinks[docBacklink.id])?.backlinks"
                  :display-map="displayMap"
                  :doc-backlink-fold-status-map="docBacklinkFoldStatusMap"
                  :doc-backlink="docBacklink"
                  :current-doc-id="currentDocId"
                  @switch-backlink-doc-block-fold-status="switchBacklinkDocBlockFoldStatus"
                  :filterList="filterList"
                />
                <!-- <div
                  ref="renderRef"
                  @mouseleave="onMouseLeave"
                  :style="{
                    height: docBacklinkFoldStatusMap[docBacklink.id] ? '0px' : 'max-content',
                    overflow: 'hidden',
                  }"
                ></div> -->
              </div>
            </ul>
          </div>
        </template>
        <template v-else>
          <div
            class="vBacklinkContainer backlinkList"
            ref="backlinkListRef"
          >
            <ul class="b3-list b3-list--background">
              <div
                v-for="docBacklink of docBacklinks"
                :key="docBacklink.id"
                class="backlinkDocBlock"
              >
                <div class="backlinkDocBlockTitleLineSticky">
                  <div
                    class="backlinkDocBlockTitleLine"
                    @click="switchBacklinkDocBlockFoldStatus(docBacklink)"
                  >
                    <div
                      class="backlinkDocBlockFolder"
                      :style="{
                        transform: `rotateZ(${docBacklinkFoldStatusMap[docBacklink.id] ? '0' : '90'}deg)`,
                      }"
                    >
                      <SyIcon
                        name="iconPlay"
                        size="10"
                      />
                    </div>
                    <li
                      class="b3-list-item b3-list-item--hide-action"
                    >
                      <span class="b3-list-item__text">{{ docBacklink.name }}</span>
                    </li>
                  </div>
                </div>
                <div
                  ref="renderRef"
                  @mouseleave="onMouseLeave"
                  :style="{
                    height: docBacklinkFoldStatusMap[docBacklink.id] ? '0px' : 'max-content',
                    overflow: 'hidden',
                  }"
                ></div>
              </div>
            </ul>
          </div>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { request, sql } from '@/api';
import { usePlugin } from '@/main';
import { hideGutterOnTarget, queryAllByDom } from '@/utils/DOM';
import { IProtyle, Protyle } from 'siyuan';
import { computed, ref, watch, watchEffect } from 'vue';
import SyIcon from '@/components/SiyuanTheme/SyIcon.vue'
import BacklinkBlock from './Backlink/BacklinkBlock.vue'
import { SyDomNodeTypes, checkNodeHasBlockRef, getBlockRefNodes, getChildNodeList, getSyHeadingNodeType, hideDom, isSyBreadCrumb, isSyNodeBlockquote, isSyNodeHeading, isSyNodeList, isSyNodeListItem, isSyNodeParagraph, isSyNodeSuperBlock, isSyNodeTable, showDom } from '@/utils/Siyuan';

interface Node {
  id: string;
  parent_id: string;
  name: string;
  treePath: string;
  level: number;
  _type: 'doc' | 'block_Ref';
}

interface UnionNode {
  id: string;
  name: string;
  _type: 'doc' | 'block_Ref';
  links: Node[];
}

const props = defineProps({
  detail: Object,
  element: HTMLDivElement
})
const protyle = computed(() => props.detail.value.protyle as IProtyle)
const currentDocId = computed(() => protyle.value?.block?.id)
const docBacklinks = ref([])
const docBacklinkFoldStatusMap = ref({})
const switchBacklinkDocBlockFoldStatus = (docBacklink) => {
  docBacklinkFoldStatusMap.value[docBacklink.id] = !docBacklinkFoldStatusMap.value[docBacklink.id]
}

const useV = ref(true);

const properties = ref<{
  [key: string]: {
    checked: boolean;
    origin: UnionNode;
  }
}>({})
const refLinks = ref<Array<Node>>([])
const backlinkBlockRefNodes = ref([])
const filterList = computed(() => {
  const result = []
  Object.keys(properties.value).forEach((key) => {
    result.push({
      key,
      include: properties.value[key].checked
    })
  })
  return result
})

const backlinkFilterPanelShownStatus = ref(true)
const switchBacklinkFilterPanelShownStatus = () => {
  backlinkFilterPanelShownStatus.value = !backlinkFilterPanelShownStatus.value
}

const handleClickFilterTag = (event: MouseEvent, item: UnionNode) => {
  const {
    shiftKey,
  } = event
  const exist = properties.value[item.id]

  let checkValue = true
  if (shiftKey) {
    checkValue = false
  }

  if (exist) {
    delete properties.value[item.id]
  } else {
    properties.value[item.id] = {
      checked: checkValue,
      origin: item
    }
  }
}

const excludeRefs = computed<Array<UnionNode>>(() => {
  const list = []
  Object.keys(properties.value).forEach((key) => {
    const item = properties.value[key]
    if (!item.checked) {
      list.push(item.origin)
    }
  })
  console.log('ex is ', list)
  return list
})
const includeRefs = computed<Array<UnionNode>>(() => {
  const list = []
  Object.keys(properties.value).forEach((key) => {
    const item = properties.value[key]
    if (item.checked) {
      list.push(item.origin)
    }
  })
  console.log('in is ', list)
  return list
})

const backlinkListRef = ref<HTMLElement>(null)
const dealedDomList = ref<Array<{
  dom: HTMLElement;
  // display: string;
}>>([])
const storeDom = (dom: HTMLElement) => {
  // hideDom(dom)
  // dom.dataset.filterValid = 'true'
  dealedDomList.value.push({
    dom,
    // display: dom.style.display
  })
  // dom.dataset.vShown = 'false'
}
const recoverDom = (node) => {
  const { dom } = node
  showDom(dom)
  // dom.dataset.vShown = 'true'
  delete dom.dataset.include
}
const recoverDealedDom = (dom) => {
  dealedDomList.value = dealedDomList.value.filter((item) => {
    if (item.dom == dom) {
      recoverDom(item)
      return false
    }
    return true
  })
}
const recoverAllDealedDoms = () => {
  dealedDomList.value.forEach((node) => {
    recoverDom(node)
  })
  dealedDomList.value = []
}

const dealNodesRecursion = (list: HTMLElement[], callback: (node: HTMLElement) => void) => {
  if (!list || !list.length) {
    return
  }

  for (let index = 0; index < list.length; index++) {
    const node = list[index]
    // 叶子块
    const isParagraph = isSyNodeParagraph(node)
    const isTable = isSyNodeTable(node)
    const isHeading = isSyNodeHeading(node)

    const isLeafNode = false
      || isParagraph
      || isTable
      || isHeading


    // 容器块
    const isNodeListItem = isSyNodeListItem(node)
    const isNodeList = isSyNodeList(node)
    const isNodeBlockquote = isSyNodeBlockquote(node)
    const isNodeSuperBlock = isSyNodeSuperBlock(node)


    const isContainerNode = false
      || isNodeListItem
      || isNodeList
      || isNodeBlockquote
      || isNodeSuperBlock

    if (!isLeafNode && !isContainerNode) {
      continue
    }
    callback(node)
    dealNodesRecursion([...node.children] as HTMLElement[], callback)
  }
}

const filterProtyleNodes = (wysiwyg) => {
  const children = wysiwyg.children


}

const markBlockRefNode = (node: HTMLElement, include: string, needCheckNodeListItems?: HTMLElement[]) => {
    let currentNode = node
    while (currentNode && !currentNode.classList.contains('backlinkDocBlock')) {
      if (currentNode.dataset.include) {
        return
      }
      currentNode.dataset.include = include
      storeDom(currentNode)

      // check heading

      // check whether child list need to selected
      if (isSyNodeListItem(currentNode) && needCheckNodeListItems) {
        needCheckNodeListItems.push(currentNode)
      }
      checkNodeParentHeading(currentNode, include)
      currentNode = currentNode.parentElement
    }
  }

const checkNodeListShownStatus = (nodeListItem: HTMLElement) => {
  const children = [...nodeListItem.children]
  const nodeList = children.find((item) => isSyNodeList(item as HTMLElement)) as HTMLElement
  if (nodeList) {
    const listChildren = [...nodeList.children]
    const marked = listChildren.some((item: HTMLElement) => item.dataset.include)
    if (!marked) {
      nodeList.dataset.include = nodeListItem.dataset.include
      storeDom(nodeList)
      // 递归标记
      dealNodesRecursion(listChildren as HTMLElement[], (node) => {
        node.dataset.include = nodeListItem.dataset.include
        storeDom(node)
      })
    }
  }
}

const checkNodeParentHeading = (node: HTMLElement, include: string) => {
  let prevDom = node.previousElementSibling as HTMLElement
  let headingType = ''
  while (prevDom) {
    if (prevDom && isSyNodeHeading(prevDom)) {
      const curHeadingType = getSyHeadingNodeType(prevDom)
      if (curHeadingType < headingType) {
        break
      }
      prevDom.dataset.include = include
      storeDom(prevDom)
      headingType = curHeadingType
    }
    prevDom = prevDom.previousElementSibling as HTMLElement
  }
}

const filterBacklinkDomNodes2 = () => {
  recoverAllDealedDoms()

  if (!backlinkListRef.value) {
    return
  }

  if (!excludeRefs.value.length && !includeRefs.value.length) {
    return
  }

  const blockRefNodes = getBlockRefNodes(backlinkListRef.value)
  if (!blockRefNodes.length) {
    return
  }

  const inBlockRefNodes = blockRefNodes.filter((node: HTMLElement) => includeRefs.value.find(i => i.id == node.dataset.id))
  const exBlockRefNodes = blockRefNodes.filter((node: HTMLElement) => excludeRefs.value.find(i => i.id == node.dataset.id))
  const needCheckNodeListItems = []
  exBlockRefNodes.forEach((item: HTMLElement) => {
    markBlockRefNode(item, 'false', needCheckNodeListItems)
  })
  inBlockRefNodes.forEach((item: HTMLElement) => {
    markBlockRefNode(item, 'true', needCheckNodeListItems)
  })

  needCheckNodeListItems.forEach((nodeListItem: HTMLElement) => {
    if (nodeListItem.dataset.include === 'true') {
      const children = [...nodeListItem.children] as HTMLElement[]
      children.filter((item) => !isSyNodeList(item))
        .forEach((item: HTMLElement) => {
          item.dataset.include = 'true'
        })
    }
    checkNodeListShownStatus(nodeListItem)
  })

  const backlinkDocBlockList = queryAllByDom(backlinkListRef.value, '.backlinkDocBlock')

  if (!backlinkDocBlockList.length) {
    return
  }

  backlinkDocBlockList.forEach((item: HTMLElement) => {
    const wysiwyg = item.querySelector('.protyle-wysiwyg')
    if (!wysiwyg) {
      return
    }

    dealNodesRecursion([...wysiwyg.children] as HTMLElement[], (node) => {
      if (!node.dataset.include || node.dataset.include === 'false') {
        storeDom(node)
        hideDom(node)
      }
    })

    const breadCrumbList = queryAllByDom(item, `.${SyDomNodeTypes.BreadCrumb}`)
    breadCrumbList.forEach((item: HTMLElement) => {
      const nextDom = item.nextElementSibling as HTMLElement
      if (!nextDom) return

      if (!nextDom.dataset.include || nextDom.dataset.include == 'false') {
        storeDom(item)
        hideDom(item)
      }
    })

    const protyleDom = item.querySelector('.protyle') as HTMLElement
    const titleLine = item.querySelector('.backlinkDocBlockTitleLineSticky') as HTMLElement
    if (!protyleDom) {
      storeDom(titleLine)
      hideDom(titleLine)
    }
    if (!protyleDom.dataset.include || protyleDom.dataset.include === 'false') {
      storeDom(protyleDom)
      hideDom(protyleDom)
      storeDom(titleLine)
      hideDom(titleLine)
    }
  })
}
watch([excludeRefs, includeRefs], () => {
  filterBacklinkDomNodes2()
  // convertIntoTreeData()
})


const unionRefLinks = computed<UnionNode[]>(() => {
  const result: UnionNode[] = []
  const currentDocId = protyle.value?.block?.id;
  const validRefLinks = refLinks.value.filter((item) => {
    const itemAsParentPath = item.treePath.replace(new RegExp(`(?<=(\\([^\\(\\)]*${item.id}[^\\(\\)]*\\))).*$`), '')
    if (includeRefs.value.length) {
      const isInItemOrIsChildOrParentOfInItem = includeRefs.value.every((inItem) => {
        if (inItem.id === item.id) {
          return true
        }
        const inItemIsParentOfItem = item.treePath.includes(inItem.id)
        const inItemIsChildOfItem = inItem.links.some(l => l.treePath.startsWith(itemAsParentPath))
        if (inItemIsChildOfItem || inItemIsParentOfItem) {
          return true
        }
        return false
      })
      if (!isInItemOrIsChildOrParentOfInItem) {
        return false
      }
    }

    if (excludeRefs.value.length) {
      const isExItemOrIsChildOfExItem = excludeRefs.value.some((exItem) => {
        if (exItem.id === item.id) {
          return true
        }
        const isChildOfExItem = item.treePath.includes(exItem.id)
        if (isChildOfExItem) {
          return true
        }
      })
      if (isExItemOrIsChildOfExItem) {
        return
      }
    }

    return true
  })

  validRefLinks
  .filter(i => {
    return i.id !== currentDocId && includeRefs.value.every(inItem => inItem.id !== i.id) && excludeRefs.value.every(exItem => exItem.id !== i.id)
  })
  .forEach((item) => {
    if (item._type === 'doc') {
      const docDirectChildren = refLinks.value.filter(i => i.level === 2 && i.treePath.startsWith(item.id))

      const n = {
        ...item,
        links: docDirectChildren.map((child) => {
          const tempPath = child.treePath.replace(/\).*$/g, '')
          const isValid = validRefLinks.length + docDirectChildren.length === refLinks.value.length || validRefLinks.find(i => i.treePath.startsWith(tempPath))
          const r: Node = {
            ...child,
            treePath: tempPath,
          }
          return isValid ? r : undefined
        }).filter(i => i)
      }
      if (n.links.length) {
        delete n.treePath
        result.push(n)
      }
      return
    }

    const exist = result.find(i => i.id === item.id)
    if (exist) {
      exist.links.push(item)
    } else {
      const n = {
        ...item,
        links: [
          item,
        ]
      }
      delete n.treePath
      result.push(n)
    }
  })

  result.sort((a, b) => (b.links.length - a.links.length))
  return result
})

const blockBackLinks = ref({})
const renderRef = ref([])
const displayMap = ref({})
watchEffect(() => {
  let flag
  props.element.addEventListener('scroll', () => {
    if (flag) {
      clearTimeout(flag)
    }
    setTimeout(() => {
      renderRef.value.forEach((item) => {
        hideGutterOnTarget(item)
      })
    }, 50)
  })
})

const onMouseLeave = (event) => {
  hideGutterOnTarget(event.target)
}

const getData = async () => {
  const plugin = usePlugin()
  const currentDocId = protyle.value?.block?.id;
  if (!currentDocId) {
    return
  }
  blockBackLinks.value = {}
  const res = await request('/api/ref/getBacklink2', {
    id: currentDocId,
    sort: '3',
    mSort: '3',
    k: '',
    mk: '',
  })
  const { backlinks } = res;

  if (!backlinks.length) {
    return
  }
  docBacklinks.value = backlinks

  const results = await Promise.all(backlinks.map((item) => {
    return request('/api/ref/getBacklinkDoc', {
      defID: currentDocId,
      refTreeID: item.id,
      keyword: '',
    })
  }))
  refLinks.value = []
  backlinkBlockRefNodes.value = []
  let tempBlockRefNodes = []
  for (let index = 0; index < backlinks.length; index++) {
    const item = backlinks[index]
    const node: Node = {
      id: item.id,
      parent_id: null,
      name: item.name,
      treePath: `${item.id}`,
      level: 0,
      _type: 'doc',
    }
    const childNodeIds = []
    // childNodeIds.push(item.id)
    const blockBacklinksTemp = results[index]
    blockBackLinks.value[item.id] = blockBacklinksTemp

    blockBacklinksTemp.backlinks.forEach((b) => {
      childNodeIds.push(b.blockPaths[b.blockPaths.length - 1].id)
      // childNodeIds.push(b.blockPaths[1].id)
    })

    let sqlResult = await sql(`
      WITH RECURSIVE parentList AS (
        SELECT id, parent_id, content, fcontent, markdown, type, subtype
        FROM blocks
        WHERE id in (${childNodeIds.map(i => `'${i}'`).join(', ')})
        and content is not null and content <> ''
        UNION
        SELECT c.id, c.parent_id, c.content, c.fcontent, c.markdown, c.type, c.subtype
        FROM blocks c
        JOIN parentList ct ON c.id= ct.parent_id
        where c.content is not null and c.content <> ''
      ), childList AS (
        SELECT id, parent_id, content, fcontent, markdown, type, subtype
        FROM blocks
        WHERE id in (${childNodeIds.map(i => `'${i}'`).join(', ')})
        and content is not null and content <> ''
        UNION
        SELECT c.id, c.parent_id, c.content, c.fcontent, c.markdown, c.type, c.subtype
        FROM blocks c
        JOIN childList ct ON c.parent_id= ct.id
        where c.content is not null and c.content <> ''
      )
      SELECT DISTINCT * FROM parentList
      UNION
      select DISTINCT * FROM childList
    `)
    sqlResult.forEach((sqlRes) => {
      const { id } = sqlRes
      sqlRes.treePath = id
    })
    sqlResult.filter((i) => i.level === 1)
      .forEach((i) => {
        i.treePath = `${node.treePath}/${i.treePath}`
      })
    const pList = sqlResult.filter(i => ['p', 't', 'h'].includes(i.type))
    pList.forEach((p) => {
      const { markdown } = p
      const reg = /\(\([^)].*?\)\)/g
      const match = markdown.match(reg)
      if (match) {
        const parent = sqlResult.find(i => i.id === p.parent_id)
        let paths = []
        match.forEach((m) => {
          const [key, value] = m.replace(/[\(\)]/g, '').split(' ')
          const fValue = value.substring(1, value.length - 1)
          paths.push(key)
          const n: Node = {
            id: key,
            parent_id: p.id,
            name: fValue,
            treePath: `${key}`,
            level: p.level,
            _type: 'block_Ref',
          }
          sqlResult.push(n)
        })
        if (parent) {
          parent.treePath += `/(${paths.join('|')})`
        }
      }
    })
    sqlResult.forEach((sqlRes) => {
      const { id, treePath } = sqlRes
      const others = sqlResult.filter(i => i.parent_id === id)
      // sqlRes.children = others
      others.forEach((i) => {
        i.treePath = `${treePath}/${i.treePath}`
      })
    })
    const temp = JSON.parse(JSON.stringify(sqlResult))
    temp.forEach((tempNode) => {
      const { id } = tempNode
      const childList = temp.filter(i => i.parent_id === id && i.type === 'l')
      tempNode.childList = childList
      tempNode.content = temp.filter(i => i.parent_id === id && i.type !== 'l')
      // tempNode.children = temp.filter(i => i.parent_id === id)
    })
    console.log('sqlResult is ', temp.filter(i => !i.parent_id))
    sqlResult = sqlResult.filter(i => i._type === 'block_Ref').concat([node])
    refLinks.value.push(...sqlResult)

    if (useV.value) {
      new Protyle(plugin.app, renderRef.value[index], {
        blockId: currentDocId,
        backlinkData: blockBacklinksTemp.backlinks,
        render: {
            background: false,
            title: false,
            gutter: true,
            scroll: false,
            breadcrumb: false,
        }
      })
    }
  }
}
watchEffect(() => {
  const currentDocId = protyle.value?.block?.id;
  if (!currentDocId) {
    return
  }
  getData()
})

const backlinkAreaFolded = ref(false);
const switchBacklinkAreaFoldStatus = () => {
  backlinkAreaFolded.value = !backlinkAreaFolded.value;
}

</script>

<style>
:root {
  --v-backlink-area-bg-color: var(--b3-theme-surface);
  --v-backlink-area-border-radius: var(--b3-border-radius);
  --v-border-color: var(--b3-list-hover, #363636);
  --v-shadow-color: var(--b3-theme-background);
  --v-block-card-background: var(--b3-theme-background);
}

.enhanceProtyleBottomContainer {
  display: flex;
  flex-direction: column;
}
</style>

<style scoped lang="scss">
.ProtyleBottomContainer {
  // background-color: red;
  display: flex;
  flex-direction: column;

  .enhanceToBottomIndicator {
    height: 2px;
    // background-color: blue;
  }

  .backlinkArea {
    padding-bottom: 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;

    .backlinkAreaTitleLine {
      display: flex;
      align-items: center;
      padding: 8px 0px;
      border-bottom: 1px solid var(--v-border-color);
      cursor: pointer;
      position: relative;

      .backlinkAreaFolder {

        width: 20px;
        height: 20px;
        display: none;
        align-items: center;
        justify-content: center;
        position: absolute;
        color: var(--b3-theme-on-surface-light);
        margin-left: -20px;
        z-index: 1;
        transition: all 0.1s linear;
      }

      &:hover .backlinkAreaFolder,
      .backlinkAreaFolder:hover {
        display: flex;
      }

      .backlinkTitle {
        flex: 1;
      }

      .opts {
        display: flex;
      }
    }

    .backlinkFilterContainer {
      flex-direction: column;
      gap: 8px;
      padding: 4px 0px;

      .backlinkRefListContainer {
        display: flex;
        flex-direction: row;
        flex-wrap: wrap;
        gap: 8px;
      }
    }

    .backlinkList {
      background: var(--v-backlink-area-bg-color);
      padding: 6px 10px;
      border-radius: var(--v-backlink-area-border-radius);

      .backlinkDocBlock {
        // background: var(--v-block-card-background);
        // border-radius: var(--v-backlink-area-border-radius);
        // border: 1px solid var(--v-border-color);
        // margin-bottom: 6px;
        // box-shadow: 2px 2px 4px var(--v-shadow-color);

        .backlinkDocBlockTitleLineSticky {
          position: sticky;
          top: 0;
          z-index: 2;
          display: flex;
        }
        .backlinkDocBlockTitleLine {
          width: 100%;
          display: flex;
          align-items: center;
          cursor: pointer;
          position: relative;
          background: var(--v-backlink-area-bg-color);
          // border-top-right-radius: var(--v-backlink-area-border-radius);
          // border-top-left-radius: var(--v-backlink-area-border-radius);
          padding: 2px 0px;

          .backlinkDocBlockFolder {
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: var(--b3-theme-on-surface-light);
            z-index: 1;
            transition: all 0.1s linear;
            visibility: hidden;
          }
          &:hover .backlinkDocBlockFolder,
          .backlinkDocBlockFolder:hover {
            visibility: visible;
          }
        }

        .protyle {
          background: unset;
          min-height: unset;

          :deep(.protyle-wysiwyg) {
            padding: 0px 36px;

            .protyle-breadcrumb__bar {
              min-height: unset;
              margin-bottom: unset !important;
              flex-wrap: wrap;

              // TODO 去掉，否则没有跳转正文的入口了
              // .protyle-breadcrumb__item:only-child {
              //   display: none;
              // }
              .protyle-breadcrumb__item.protyle-breadcrumb__item--active {
                // display: none;

                .protyle-breadcrumb__text {
                  display: none;
                }

                & ~ .protyle-breadcrumb__item .protyle-breadcrumb__text{
                  display: none;
                }
              }
            }

            .protyle-breadcrumb__bar:not(:first-child) {
              border-top: 1px solid var(--v-border-color);
            }

          }
        }

        & .b3-list-item {
          background: unset;
          margin-top: unset;
          margin-left: unset;
          padding-left: unset;
        }
      }
    }
  }

}
</style>
