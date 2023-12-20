<template>
  <div class="ProtyleBottomContainer">
    <div class="enhanceToBottomIndicator" :data-node-id="protyle.block.id"></div>
    <div class="backlinkArea" v-if="enableBottomBacklink">
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
            v-if="enableBacklinkFilter"
            @click="switchBacklinkFilterPanelShownStatus"
            name="iconFilter"
            size="14"
          />
        </div>

      </div>
      <div
        v-if="enableBacklinkFilter"
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
            v-for="item of remainRefs"
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
            <!-- TODO 实现选项的统计 -->
            <sup
              style="
                margin-left: 2px
              "
            >
              {{ linkNumMap[item.id] }}
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
        <template v-else>
          <div
            class="vBacklinkContainer backlinkList"
            ref="backlinkListDomRef"
          >
            <ul class="b3-list b3-list--background">
              <div
                v-for="docBacklink of docBacklinks"
                :key="docBacklink.id"
                class="backlinkDocBlock"
              >
                <div class="backlinkDocBlockTitleLineSticky" :data-node-id="docBacklink.id">
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
import {
chainHasRefNode,
  chainHasTargetBlockRefId,
  getTreeChainPathOfDoc,
  hasTargetBlockRef,
  hideDom, isSyBreadCrumbDom, isSyContainerNode, isSyDocNode, isSyHeadingNode, isSyListItemNode, isSyNodeCanContainerBlockRef, showDom } from '@/utils/Siyuan';
import {
  recursionTree,
} from '@/utils';
import { useSettings } from '@/logic';


interface Node {
  id: string;
  parent_id: string;
  name: string;
  treePath: string;
  _type: 'doc' | 'block_Ref';
}
const props = defineProps({
  detail: Object,
  element: HTMLDivElement
})
const protyle = computed(() => props.detail.value.protyle as IProtyle)
const currentDocId = computed(() => protyle.value?.block?.id)
const docBacklinks = ref([])

const useV = ref(true);

const settings = useSettings()

const enableBottomBacklink = computed(() => settings.value.enableBottomBacklink)
const enableBacklinkFilter = computed(() => settings.value.enableBacklinkFilter)

// #region 基础数据处理


// #region 反链数据

const blockBackLinks = ref({})
const renderRef = ref([])
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
  for (let index = 0; index < backlinks.length; index++) {
    const item = backlinks[index]
    const blockBacklinksTemp = results[index]
    blockBackLinks.value[item.id] = blockBacklinksTemp

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
  getTreeStruct()
}

watchEffect(() => {
  const currentDocId = protyle.value?.block?.id;
  if (!currentDocId) {
    return
  }
  getData()
})


// #endregion 反链数据

// #region 反链结构数据

const backlinkDocTreeStruct = ref([])
const backlinkFlatTree = ref([])
const backlinkTreePathChains = ref([])

const getBlockRefsInDoc = async (ids: string[]) => {
  let sqlStmt = `
    select
      def_block_id as id,
      content as name
    from refs where block_id in (
      ${ids.map(i => `'${i}'`).join(', ')}
    ) group by def_block_id
  `
  return sql(sqlStmt)
}

const getTreeStruct = async () => {
  backlinkDocTreeStruct.value = []
  backlinkFlatTree.value = []
  backlinkBlockRefNodes.value = []

  const childNodeIds = []
  for (let index = 0; index < docBacklinks.value.length; index++) {
    const item = docBacklinks.value[index]
    const blockBacklinksTemp = blockBackLinks.value[item.id]
    blockBacklinksTemp.backlinks.forEach((b) => {
      childNodeIds.push(b.blockPaths[b.blockPaths.length - 1].id)
    })

  }

  // #region 获取并构建文档树结构

  let sqlResult = await sql(`
    WITH RECURSIVE parentList AS (
        SELECT
            id,
            parent_id,
            content,
            fcontent,
            markdown,
            type,
            subtype
        FROM blocks
        WHERE id in (
            ${docBacklinks.value.map(i => `'${i.id}'`).join(',')}
        )
        UNION
        SELECT c.id, c.parent_id, c.content, c.fcontent, c.markdown, c.type, c.subtype
        FROM blocks c
        JOIN parentList ct ON c.parent_id= ct.id
    )
    select * from parentList
  `)
  sqlResult.forEach((tempNode) => {
    const { id } = tempNode
    if (!isSyContainerNode(tempNode)) {
      const parent = sqlResult.find((i) => i.id == tempNode.parent_id)
      tempNode._markdown = tempNode.markdown
      if (parent && isSyContainerNode(parent) && !isSyDocNode(parent)) {
        parent._markdown += `|${tempNode._markdown}`
      }
    } else {
      tempNode._markdown = ''
    }
    const childNodeList = sqlResult.filter(i => i.parent_id === id)
    tempNode.children = childNodeList
  })

  backlinkFlatTree.value.push(...sqlResult)
  backlinkDocTreeStruct.value.push(...sqlResult.filter(i => !i.parent_id))

  // #endregion 获取并构建文档树结构



  // #region 构建树链路

  let result = []
  const rc = (list, pathChain) => {
    if (!list || !list.length) {
      result.push(pathChain)
      return
    }
    list.forEach((node) => {
      const inner = [...pathChain]
      const temp = {
        ...node,
      }
      delete temp.children
      if (isSyHeadingNode(temp)) {
        result.push(inner)
      }
      inner.push(temp)
      rc(node.children, inner)
    })
  }

  rc(backlinkDocTreeStruct.value, [])

  result = result.filter((item) => {
    return item.some(i => hasTargetBlockRef(i._markdown, currentDocId.value))
  })
  backlinkTreePathChains.value = result

  // #endregion 构建树链路


  const ids = sqlResult.filter(i => isSyNodeCanContainerBlockRef(i)).map(i => i.id)
  const allDocBlockRefs = await getBlockRefsInDoc(ids)
  const blockRefsOptions = allDocBlockRefs.filter((blockRef) => {
    if (blockRef.id === currentDocId.value) {
      return false
    }
    return backlinkTreePathChains.value.some(chain => chain.some(i => hasTargetBlockRef(i._markdown, blockRef.id)))
  })
  backlinkBlockRefNodes.value = [
    ...blockRefsOptions.map(i => ({
      ...i,
      _type: 'blockRef',
    })),
    ...docBacklinks.value.map(i => ({
      id: i.id,
      name: i.name,
      _type: 'doc',
    }))
  ]
}

// #endregion 反链结构数据

// #endregion 基础数据处理



// #region 折叠控制相关

const docBacklinkFoldStatusMap = ref({})
const switchBacklinkDocBlockFoldStatus = (docBacklink) => {
  docBacklinkFoldStatusMap.value[docBacklink.id] = !docBacklinkFoldStatusMap.value[docBacklink.id]
}

const backlinkAreaFolded = ref(false);
const switchBacklinkAreaFoldStatus = () => {
  backlinkAreaFolded.value = !backlinkAreaFolded.value;
}

// #endregion 折叠控制相关



// #region 反链筛选项相关功能

const backlinkFilterPanelShownStatus = ref(true)
const switchBacklinkFilterPanelShownStatus = () => {
  backlinkFilterPanelShownStatus.value = !backlinkFilterPanelShownStatus.value
}

const properties = ref<{
  [key: string]: {
    include: boolean;
    origin: Node;
  }
}>({})
const backlinkBlockRefNodes = ref<Node[]>([])


const notSelectedRefs = computed<Array<Node>>(() => {
  return backlinkBlockRefNodes.value.filter((i) => !properties.value[i.id])
})
const remainRefs = computed<Array<Node>>(() => {
  let list = notSelectedRefs.value
  return list.filter((blockRef) => {
    return validBacklinkTreePathChain.value.some((chain) => {
      return chainHasRefNode(chain, blockRef)
    })
  })
})

const excludeRefs = computed<Array<Node>>(() => {
  const list = []
  Object.keys(properties.value).forEach((key) => {
    const item = properties.value[key]
    if (!item.include) {
      list.push(item.origin)
    }
  })
  return list
})
const includeRefs = computed<Array<Node>>(() => {
  const list = []
  Object.keys(properties.value).forEach((key) => {
    const item = properties.value[key]
    if (item.include) {
      list.push(item.origin)
    }
  })
  return list
})

const handleClickFilterTag = (event: MouseEvent, item: Node) => {
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
      include: checkValue,
      origin: item,
    }
  }
}


const validBacklinkTreePathChain = computed(() => {
  return [...backlinkTreePathChains.value].filter((chain) => {
    if (excludeRefs.value.length) {
      const hasExNode = excludeRefs.value.some(i => chainHasRefNode(chain, i))
      if (hasExNode) {
        return false
      }
    }

    const selectIncludes = !!includeRefs.value.length
    if (selectIncludes) {
      const someNotIn = includeRefs.value.some(i => !chainHasRefNode(chain, i))
      if (someNotIn) {
        return false
      }
    }

    return true
  })
})


// #endregion 反链筛选项相关功能

// #region 根据树结构处理页面元素

const backlinkListDomRef = ref<HTMLElement>(null)
const dealedDomList = ref<Array<HTMLElement>>([])
const storeDom = (dom) => {
  dealedDomList.value.push(dom)
}
const storeAndHidDom = (dom) => {
  hideDom(dom)
  storeDom(dom)
}
const recoverDom = (dom) => {
  showDom(dom)
  dealedDomList.value = dealedDomList.value.filter(i => i != dom)
}
const recoverAllDealedDoms = () => {
  dealedDomList.value.forEach((node) => {
    recoverDom(node)
  })
  dealedDomList.value = []
}

watch(validBacklinkTreePathChain, () => {
  hideDomByBlockRefTree()
})

const hideDomByBlockRefTree = () => {
  recoverAllDealedDoms()

  if (!backlinkListDomRef.value) {
    return
  }

  if (!excludeRefs.value.length && !includeRefs.value.length) {
    return
  }

  const getDomAndDeal = (curNode, hide) => {
    const doms = queryAllByDom(backlinkListDomRef.value, `[data-node-id="${curNode.id}"]`)
    const hideOrShowDom = (dom) => {
      if (hide) {
        storeAndHidDom(dom)
      } else {
        recoverDom(dom)
      }
    }
    if (doms.length) {
      doms.forEach((dom) => {
        hideOrShowDom(dom)

        const prevDom = dom.previousElementSibling as HTMLElement
        if (prevDom && isSyBreadCrumbDom(prevDom)) {
          hideOrShowDom(prevDom)
        }
        const isTitleLine = dom.classList.contains('backlinkDocBlockTitleLineSticky')
        if (isTitleLine) {
          const protyleDom = dom.nextElementSibling as HTMLElement
          hideOrShowDom(protyleDom)
        }
      })
    }
  }

  const needDealChildContent = []
  recursionTree(backlinkDocTreeStruct.value, null, (curNode) => {
    const targetChain = validBacklinkTreePathChain.value.find((chain) => chain.some(i => i.id == curNode.id))
    const inChain = !!targetChain
    if (!inChain) {
      getDomAndDeal(curNode, true)
    } else {
      if (isSyListItemNode(curNode)) {
        needDealChildContent.push(curNode)
      }
    }
  })

  needDealChildContent.forEach((listItemNode) => {
    const childContent = backlinkFlatTree.value.filter(i => i.parent_id == listItemNode.id && !isSyContainerNode(i))
    childContent.forEach((childContentNode) => {
      getDomAndDeal(childContentNode, false)
    })
  })
}

// #endregion 根据树结构处理页面元素


// #region 处理gutter显示问题
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
// #endregion 处理gutter显示问题

const linkNumMap = computed(() => {
  const map = {}
  const chainList = validBacklinkTreePathChain.value.length ? validBacklinkTreePathChain.value : backlinkTreePathChains.value

  remainRefs.value.forEach((node) => {
    let num = 0
    if (node._type === 'doc') {

      const docTreePathChain = backlinkTreePathChains.value.filter((chain) => {
        const first = chain[0]
        const lastInChain = chain[chain.length - 1]
        return first.id == node.id && hasTargetBlockRef(lastInChain._markdown, currentDocId.value)
      })

      const allDocCurDocRefPaths = getTreeChainPathOfDoc(docTreePathChain)
      const validRefPaths = getTreeChainPathOfDoc(validBacklinkTreePathChain.value)

      const uniqueDocRefPath = new Set()
      allDocCurDocRefPaths.forEach((path) => {
        const inValidPathList = validRefPaths.some((i: string) => i.startsWith(path))
        if (inValidPathList) {
          uniqueDocRefPath.add(path)
        }
      })

      num = uniqueDocRefPath.size
    } else {
      let validChainList = chainList.filter((chain) => {
        const lastInChain = chain[chain.length - 1]
        return chainHasTargetBlockRefId(chain, node.id) && hasTargetBlockRef(lastInChain._markdown, node.id)
      })

      num = validChainList.length
    }
    map[node.id] = num || ''
  })
  return map
})

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
