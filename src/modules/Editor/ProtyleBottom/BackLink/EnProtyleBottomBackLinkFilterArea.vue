<template>
  <div class="backlinkSearchArea">
    <a-card :bordered="false" hoverable>
      <div class="searchMain">
        <div class="flexColumn" style="flex: 1; overflow: hidden;">


          <div style="display: flex; gap: 2px; align-items: center;">
            <b>过滤</b>
            <a-popover
                trigger="click"
              position="tl"
            >
              <div
                class="prompt"
              >
                <icon-exclamation-circle-fill />
              </div>
              <template #content>
                <div>
                  桌面端：单击左键来包含，或则 shift-单击左键来排除，再次点击取消选中。
                </div>
                <div>
                  全平台：单击包含，双击排除。
                </div>
              </template>
            </a-popover>
          </div>


            <EnTagsContainer class="blockRefList" v-if="sortedRemainRefs.length">
              <a-tag
                v-for="item of sortedRemainRefs"
                :key="`${item.id}_${item.name}`"
                :title="item.name"
                @click="event => handleClickFilterTag(event, item)"
              >
                <span class="optionName">
                  {{ item.name }}
                </span>
                <sup
                  style="
                    margin-left: 2px
                  "
                >
                  {{ linkNumMap[`${item.id}_${item.name}`] }}
                </sup>
              </a-tag>
            </EnTagsContainer>
            <template v-if="includeRefs.length">
              <div>
                包括以下链接:
              </div>
              <EnTagsContainer class="blockRefList">
                <a-tag
                  v-for="item of includeRefs"
                  :key="`in_${item.id}_${item.name}`"
                  :title="item.name"
                  @click="event => handleClickFilterTag(event, item)"
                >
                  <span class="optionName">
                    {{ item.name }}
                  </span>
                </a-tag>
              </EnTagsContainer>
            </template>
            <template v-if="excludeRefs.length">
              <div>
                不包括以下链接:
              </div>
              <EnTagsContainer class="blockRefList">
                <a-tag
                  v-for="item of excludeRefs"
                  :key="`ex_${item.id}_${item.name}`"
                  :title="item.name"
                  @click="event => handleClickFilterTag(event, item)"
                >
                  <span class="optionName">
                    {{ item.name }}
                  </span>
                </a-tag>
              </EnTagsContainer>
            </template>

            <div>
              其他操作：
            </div>
            <EnTagsContainer class="blockRefList">
              <a-popconfirm
                position="tl"
                v-model:popupVisible="saveFilterPopVisible"
                @ok="saveCurrentProperties"
                @popupVisibleChange="onSavePopconfirmVisibleChange"
              >
                <a-tag class="filterBtn">保存当前条件</a-tag>
                <template #icon><div></div></template>
                <template #content>
                  <a-space>
                    <div>名称</div>
                    <a-input
                      ref="filterNameInputRef"
                      v-model="currentFilterName"
                      @keyup.enter="saveCurrentProperties"
                    />
                  </a-space>
                </template>
              </a-popconfirm>
              <a-tag
                class="filterBtn"
                @click="() => switchDisplayType()"
              >
                {{ displayTypeMap[displayType] }}
              </a-tag>

            </EnTagsContainer>

            <div>
              已保存的条件:
            </div>
            <EnTagsContainer class="blockRefList">
              <a-tag
                @click="() => properties = {}"
              >
                <a-space>
                  <span class="optionName">
                    一键清空
                  </span>
                </a-space>
              </a-tag>
              <a-tag
                v-for="item of savedNames"
                :key="'saved-' + item"
                @click="(event) => onSavedPropertiesClick(event, item)"
              >
                <a-space>
                  <span class="optionName">
                    {{ item }}
                  </span>
                  <span @click.stop="() => deleteSavedProperties(item)">
                    <icon-minus style="color: red" class="removeSavedProperties" />
                  </span>
                </a-space>
              </a-tag>
            </EnTagsContainer>

        </div>
      </div>
    </a-card>
  </div>
</template>

<script lang="ts">
export interface FilterProperties {
  [key: string]: {
    include: boolean;
    origin: Node;
  }
}
</script>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { BottomBacklinkModuleName, BottomBacklinkModuleOptions, IBacklink } from './EnProtyleBottomBackLink.vue';
import { sql } from '@/api';
import { useModule } from '@/modules/Settings/EnSettings.vue';
import { chainHasRefNode, chainHasTargetBlockRefIdAndName, getTreeChainPathOfDoc, hasTargetBlockRef, hasTargetBlockRefIdAndName, hideDom, isSyBreadCrumbDom, isSyContainerNode, isSyDocNode, isSyHeadingNode, isSyListItemNode, isSyNodeCanContainerBlockRef, showDom } from '@/utils/Siyuan';
import { debounce, recursionTree } from '@/utils';
import EnTagsContainer from '@/components/EnTagsContainer.vue';
import { onCountClick, queryAllByDom } from '@/utils/DOM';
import { usePlugin } from '@/main';

interface Node {
  id: string;
  blockRefId: string;
  parent_id: string;
  name: string;
  treePath: string;
  _type: 'doc' | 'blockRef';
}

const props = defineProps<{
  backlinks: IBacklink[]
  blockBacklinks: any
  currentDocId: string
  backlinkListDomRef: any
}>()

const module = useModule(BottomBacklinkModuleName)
const moduleOptions = computed(() => module.value.options as BottomBacklinkModuleOptions)
const docFilterPropertiesSaved = computed(() => moduleOptions.value.docFilterPropertiesSaved[props.currentDocId] || {})
const savedNames = computed(() => Object.keys(docFilterPropertiesSaved.value))

const docBacklinks = computed(() => props.backlinks)
const blockBackLinks = computed(() => props.blockBacklinks)
const currentDocId = computed(() => props.currentDocId)

const backlinkDocTreeStruct = ref([])
const backlinkFlatTree = ref([])
const backlinkTreePathChains = ref([])

// 当前文档的块引列表
const backlinkBlockRefNodes = ref<Node[]>([])
const dynamicBlockRefNodes = ref<Node[]>([])
const staticBlockRefNodes = ref<Node[]>([])

const getDynamicAndStaticBlockRefs = async () => {
  const blockRefs = backlinkBlockRefNodes.value.filter(i => i._type == 'blockRef')
  const blockRefDefIds = blockRefs.map(i => i.id)
  const blockRefIds = blockRefs.map(i => i.blockRefId)

  const getSql = (isStatic: boolean) => {
    return `
      SELECT
        refs.id as blockRefId,
        refs.def_block_id as id,
        refs.content as name
      FROM
        refs
        JOIN blocks ON refs.def_block_id = blocks.id
      WHERE
        refs.def_block_id in (${blockRefDefIds.map(i => `'${i}'`).join(', ')})
        AND refs.content ${isStatic ? '!=' : '='} blocks.content
        AND refs.id in (${blockRefIds.map(i => `'${i}'`).join(', ')})
      limit ${moduleOptions.value.sqlLimit}
    `
  }

  const staticBlockRefsRes = await sql(getSql(true))
  staticBlockRefNodes.value = staticBlockRefsRes.map((i) => ({
    ...i,
    _type: 'blockRef',
  }))
  const dynamicBlockRefsRes = await sql(getSql(false))
  dynamicBlockRefNodes.value = dynamicBlockRefsRes.map((i) => ({
    ...i,
    _type: 'blockRef',
  }))
}

const nextValueMap = {
  all: 'd',
  d: 's',
  s: 'all',
}
const displayType = ref<keyof typeof nextValueMap>('all')
const displayTypeMap = {
  all: '展示全部块引',
  d: '只展示动态锚文本',
  s: '只展示静态锚文本',
}
const switchDisplayType = () => {
  const nextValue = nextValueMap[displayType.value] as keyof typeof nextValueMap
  displayType.value = nextValue
}

watch(backlinkBlockRefNodes, () => {
  getDynamicAndStaticBlockRefs()
})

watch(currentDocId, () => {
  backlinkDocTreeStruct.value = []
  backlinkFlatTree.value = []
  backlinkTreePathChains.value = []
  backlinkBlockRefNodes.value = []
}, { immediate: true })

const getBlockRefsInDoc = async (ids: string[]) => {
  let sqlStmt = `
    select
      id as blockRefId,
      def_block_id as id,
      content as name
    from refs where block_id in (
      ${ids.map(i => `'${i}'`).join(', ')}
    ) group by def_block_id, content
    limit ${moduleOptions.value.sqlLimit}
  `
  return sql(sqlStmt)
}

const getTreeStruct = async () => {

  if (!props.backlinks.length || !Object.values(props.blockBacklinks).filter(i => i).length) {
    return
  }


  const childNodeIds = []
  for (let index = 0; index < docBacklinks.value.length; index++) {
    const item = docBacklinks.value[index]
    const blockBacklinksTemp = blockBackLinks.value[item.id]
    blockBacklinksTemp?.forEach((b) => {
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
    limit ${moduleOptions.value.sqlLimit}
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
    return backlinkTreePathChains.value.some(chain => chain.some(i => {
      const result = hasTargetBlockRefIdAndName(i._markdown, blockRef.id, blockRef.name)
      return result
    }))
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

watch([props.backlinks, props.blockBacklinks], debounce(() => {
  getTreeStruct()
}, 10), { immediate: true })


const properties = ref<FilterProperties>(moduleOptions.value.docFilterProperties[props.currentDocId] || {})
watch(properties, () => {
  moduleOptions.value.docFilterProperties[props.currentDocId] = properties.value
}, {
  deep: true,
  immediate: true,
})

const saveFilterPopVisible = ref(false)

const currentFilterName = ref('')
const saveCurrentProperties = () => {
  if (!currentFilterName.value) {
    return
  }

  let savedProperties = moduleOptions.value.docFilterPropertiesSaved[props.currentDocId]
  if (!savedProperties) {
    savedProperties = moduleOptions.value.docFilterPropertiesSaved[props.currentDocId] = {}
  }
  savedProperties[currentFilterName.value] = Object.assign({}, properties.value)
  saveFilterPopVisible.value = false
}

const filterNameInputRef = ref()
const onSavePopconfirmVisibleChange = (visible) => {
  if (visible) {
    currentFilterName.value = ''
  }
  setTimeout(() => {
    if (visible && filterNameInputRef.value) {
      filterNameInputRef.value.focus()
    }
  }, 300)
}

const deleteSavedProperties = (name) => {
  const saved = Object.keys(docFilterPropertiesSaved.value)
  const temp = {}
  saved.filter(i => i != name)
    .forEach((name) => {
      temp[name] = docFilterPropertiesSaved.value[name]
    })
  moduleOptions.value.docFilterPropertiesSaved[props.currentDocId] = temp
}

const onSavedPropertiesClick = onCountClick((time, event, name) => {
  const savedProperties = docFilterPropertiesSaved.value[name]
  if (!savedProperties) {
    return
  }
  properties.value = Object.assign({}, savedProperties) as any as FilterProperties;
})

const plugin = usePlugin()
const handleClickFilterTag = onCountClick((time, event, item) => {
  const {
    shiftKey,
  } = event
  const exist = properties.value[item.id]

  let checkValue = true
  if (plugin.isMobile) {
    if (time === 2) {
      checkValue = false
    }
  } else {
    if (shiftKey) {
      checkValue = false
    } else {
      if (time === 2) {
        checkValue = false
      }
    }
  }

  if (exist) {
    delete properties.value[item.id]
  } else {
    properties.value[item.id] = {
      include: checkValue,
      origin: item,
    }
  }
})

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

const notSelectedRefs = computed<Array<Node>>(() => {
  return backlinkBlockRefNodes.value.filter((i) => !properties.value[i.id])
})
const remainRefs = computed<Array<Node>>(() => {
  let list = notSelectedRefs.value
  list = list.filter((blockRef) => {
    return validBacklinkTreePathChain.value.some((chain) => {
      return chainHasRefNode(chain, blockRef)
    })
  })

  if (displayType.value == 'd') {
    list = list.filter((node) => dynamicBlockRefNodes.value.find(i => i.id == node.id && i.name == node.name))
  } else if (displayType.value == 's') {
    list = list.filter((node) => staticBlockRefNodes.value.find(i => i.id == node.id && i.name == node.name))
  }

  return list
})
const sortedRemainRefs = computed(() => {
  const list = remainRefs.value
  list.sort((a, b) => {
    return Number(linkNumMap.value[`${b.id}_${b.name}`]) - Number(linkNumMap.value[`${a.id}_${a.name}`])
  })
  return list
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
        return chainHasTargetBlockRefIdAndName(chain, node.id, node.name) && hasTargetBlockRefIdAndName(lastInChain._markdown, node.id, node.name)
      })
      num = validChainList.length
    }
    map[`${node.id}_${node.name}`] = num || ''
  })
  return map
})


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

const hideDomByBlockRefTree = () => {
  recoverAllDealedDoms()

  if (!props.backlinkListDomRef) {
    return
  }

  if (!excludeRefs.value.length && !includeRefs.value.length) {
    return
  }

  const getDomAndDeal = (curNode, hide) => {
    const doms = queryAllByDom(props.backlinkListDomRef, `[data-node-id="${curNode.id}"]`)
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
        // const isTitleLine = dom.classList.contains('backlinkDocBlock')
        // if (isTitleLine) {
        //   const protyleDom = dom.nextElementSibling as HTMLElement
        //   hideOrShowDom(protyleDom)
        // }
      })
    }
  }

  console.log('backlinkDocTreeStruct is ', backlinkDocTreeStruct.value)
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

watch(validBacklinkTreePathChain, () => {
  hideDomByBlockRefTree()
}, {
  immediate: true,
  deep: true,
})
</script>

<style lang="scss" scoped>
.backlinkSearchArea {
  padding: var(--en-gap);

  .arco-card {
    border-radius: 4px;
  }

  :deep(.arco-card-body) {
    padding: 8px 12px;
  }

  .searchMain {
    display: flex;
    gap: var(--en-gap);
  }

  .prompt {
    display: flex;
    cursor: pointer;
  }

  .blockRefList {
    :deep(.arco-tag) {
      max-width: 150px;
      cursor: pointer;

      &:not(:last-child) {
        margin-right: 8px;
      }

      .optionName {
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }

    .filterBtn {
      color: var(--sky-blue);
    }
  }
}
</style>
