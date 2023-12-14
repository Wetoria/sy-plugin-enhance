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
            <!-- <sup
              style="
                margin-left: 2px
              "
            >
              {{ item.links.length }}
            </sup> -->
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
import { computed, ref, watchEffect } from 'vue';
import SyIcon from '@/components/SiyuanTheme/SyIcon.vue'
import { hideDom, isBlockRef, isSyBreadCrumbDom, isSyContainerNode, isSyListItemNode, isSyParagraphNode, showDom } from '@/utils/Siyuan';
import { isInTreeChain, recursionTree, reomveDuplicated } from '@/utils';

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

const useV = ref(false);

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
const getTreeStruct = async () => {
  backlinkDocTreeStruct.value = []
  backlinkFlatTree.value = []
  backlinkBlockRefNodes.value = []
  for (let index = 0; index < docBacklinks.value.length; index++) {
    const item = docBacklinks.value[index]
    const childNodeIds = []
    const blockBacklinksTemp = blockBackLinks.value[item.id]
    blockBacklinksTemp.backlinks.forEach((b) => {
      childNodeIds.push(b.blockPaths[b.blockPaths.length - 1].id)
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
      ), childList AS (
        SELECT id, parent_id, content, fcontent, markdown, type, subtype
        FROM blocks
        WHERE id in (${childNodeIds.map(i => `'${i}'`).join(', ')})
        and content is not null and content <> ''
        UNION
        SELECT c.id, c.parent_id, c.content, c.fcontent, c.markdown, c.type, c.subtype
        FROM blocks c
        JOIN childList ct ON c.parent_id= ct.id
      )
      SELECT DISTINCT * FROM parentList
      UNION
      select DISTINCT * FROM childList
    `)
    sqlResult.forEach((sqlRes) => {
      const { id } = sqlRes
      sqlRes.treePath = id
      sqlRes.level = 0
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
          const t: string = m.replace(/[\(\)]/g, '')
          const firstBlankIndex = t.indexOf(' ')
          const key = t.substring(0, firstBlankIndex)
          const value = t.substring(firstBlankIndex + 1, t.length)
          const fValue = value.substring(1, value.length - 1)
          paths.push(key)
          const n: Node = {
            id: key,
            parent_id: p.id,
            name: fValue,
            treePath: key,
            _type: 'block_Ref',
          }
          if (p.blockRefs) {
            p.blockRefs.push(n)
          } else {
            p.blockRefs = []
            p.blockRefs.push(n)
          }
          sqlResult.push(n)
        })
        if (parent) {
          parent.treePath += `/(${paths.join('|')})`
        }
      }
    })
    sqlResult.forEach((tempNode) => {
      const { id } = tempNode
      if (tempNode.type == 'd') {
        tempNode.name = tempNode.fcontent
        tempNode.level = 0
        tempNode._type = 'doc'
      }
      tempNode.children = sqlResult.filter(i => {
        const isChild = i.parent_id === id
                return isChild
      })
    })
    const blockRefNodes: Node[] = [...sqlResult.filter(i => isBlockRef(i)).map((i) => {

      return {
        id: i.id,
        parent_id: i.parent_id,
        name: i.name,
        _type: i._type,
        treePath: i.treePath,
      }
    })]
    backlinkBlockRefNodes.value.push(...blockRefNodes)
    backlinkDocTreeStruct.value.push(...sqlResult.filter(i => !i.parent_id))

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
          origin: node,
        }
        delete temp.children
        inner.push(temp)
        rc(node.children, inner)
      })
    }

    rc(backlinkDocTreeStruct.value, [])
    backlinkTreePathChains.value = result
    backlinkFlatTree.value.push(...sqlResult)
  }
  recursionTree(backlinkDocTreeStruct.value, null, (node, parent) => {
    if (parent) {
      node.level = parent.level + 1
    } else {
      node.level = 0
    }
  })
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
const backlinkBlockRefNodesDistinct = computed<Node[]>(() => {
  const list = reomveDuplicated(backlinkBlockRefNodes.value.filter(i => i.id !== currentDocId.value))
  return list
})
const notSelectedRefs = computed<Array<Node>>(() => {
  return backlinkBlockRefNodesDistinct.value.filter((i) => !properties.value[i.id])
})
const remainRefs = computed<Array<Node>>(() => {
  const list = notSelectedRefs.value
  // TODO 实现剩余选项的过滤

  return list
})
const validChain = ref([])
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

  markBacklinkTree()
}

const markBacklinkTree = () => {
  backlinkFlatTree.value.forEach(item => {
    delete item.include
  })

  // console.log('tree is ', JSON.parse(JSON.stringify(backlinkDocTreeStruct.value)))

  // const t = JSON.parse(JSON.stringify(backlinkTreePathChains.value))
  // t.forEach((item) => {
  //   item.forEach((i) => {
  //       delete i.origin
  //   })
  // })
  // console.log('t is ', t)

  let result = [...backlinkTreePathChains.value].filter((item) => {
    if (excludeRefs.value.length) {
      const hasExNode = excludeRefs.value.some(i => isInTreeChain(item, i))
      if (hasExNode) {
        return false
      }
    }

    const selectIncludes = !!includeRefs.value.length
    if (selectIncludes) {
      const someNotIn = includeRefs.value.some(i => !isInTreeChain(item, i))
      if (someNotIn) {
        return false
      }
    }

    return true
  })

  validChain.value = result

  result.forEach((chain) => {
    chain.forEach((item) => {
      const origin = item.origin
      origin.include = true
      if (isSyContainerNode(origin)) {
        origin.children.forEach((curNode) => {
          if (!isSyContainerNode(curNode)) {
            curNode.include = origin.include
            }
        })
      }
    })
  })
  // const tt = JSON.parse(JSON.stringify(result))
  // tt.forEach((item) => {
  //   item.forEach((i) => {
  //     i.include = i.origin.include
  //     delete i.origin
  //   })
  // })
  // console.log('result is ', tt)

  hideDomByBlockRefTree()
}

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
}
const recoverAllDealedDoms = () => {
  dealedDomList.value.forEach((node) => {
    recoverDom(node)
  })
  dealedDomList.value = []
}

const hideDomByBlockRefTree = () => {
  recoverAllDealedDoms()

  if (!backlinkListDomRef.value) {
    return
  }

  if (!excludeRefs.value.length && !includeRefs.value.length) {
    return
  }


  recursionTree(backlinkDocTreeStruct.value, null, (curNode) => {
    const doms = queryAllByDom(backlinkListDomRef.value, `[data-node-id="${curNode.id}"]`)
    const targetChain = validChain.value.find((chain) => chain.find(i => {
      if (curNode._type == 'block_Ref') {
        const paragraphParent = backlinkFlatTree.value.find((flatItem) => flatItem.id == curNode.parent_id)
        if (paragraphParent) {
          const parent = backlinkFlatTree.value.find((flatItem) => flatItem.id == paragraphParent.parent_id)
          if (isSyListItemNode(parent)) {
            return parent.id == i.id
          }
        }
      }
      if (isSyParagraphNode(curNode)) {
        const parent = backlinkFlatTree.value.find((flatItem) => flatItem.id == curNode.parent_id)
        if (isSyListItemNode(parent)) {
          return parent.id == i.id
        }
      }
      return i.id == curNode.id
    }))
    const inChain = !!targetChain
    // if (curNode.id == '20231214050520-u00c5w8') {
    //   console.log(targetChain)
    //   console.log('curNode is ', inChain, curNode.id, curNode.fcontent, curNode.name, '\n', curNode, '\n', doms)
    // }
    if (doms.length) {
      if (!inChain) {
        doms.forEach((dom) => {
          storeAndHidDom(dom)

          const prevDom = dom.previousElementSibling as HTMLElement
          if (prevDom && isSyBreadCrumbDom(prevDom)) {
            storeAndHidDom(prevDom)
          }
          const isTitleLine = dom.classList.contains('backlinkDocBlockTitleLineSticky')
          if (isTitleLine) {
            const protyleDom = dom.nextElementSibling as HTMLElement
            storeAndHidDom(protyleDom)
          }
        })
      }
    }
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
