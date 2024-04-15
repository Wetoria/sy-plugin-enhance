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
                单击左键来包含，或则 shift-单击左键来排除，再次点击取消选中。
              </template>
            </a-popover>
          </div>
          <EnTagsContainer className="blockRefList">
            <a-tag
              v-for="item of sortedRemainRefs"
              :key="item.id"
              :title="item.name"
              class="blockRefTag"
            >
              <span class="optionName">
                {{ item.name }}
              </span>
              <sup
                style="
                  margin-left: 2px
                "
              >
                {{ linkNumMap[item.id] }}
              </sup>
            </a-tag>
          </EnTagsContainer>
        </div>
      </div>
    </a-card>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, watchEffect } from 'vue';
import { BottomBacklinkModuleName, BottomBacklinkModuleOptions, IBacklink } from './EnProtyleBottomBackLink.vue';
import { sql } from '@/api';
import { useModule } from '@/modules/Settings/EnSettings.vue';
import { chainHasRefNode, chainHasTargetBlockRefId, getTreeChainPathOfDoc, hasTargetBlockRef, isSyContainerNode, isSyDocNode, isSyHeadingNode, isSyNodeCanContainerBlockRef } from '@/utils/Siyuan';
import { debounce } from '@/utils';
import EnTagsContainer from '@/components/EnTagsContainer.vue';

interface Node {
  id: string;
  parent_id: string;
  name: string;
  treePath: string;
  _type: 'doc' | 'block_Ref';
}

const props = defineProps<{
  backlinks: IBacklink[]
  blockBacklinks: any
  currentDocId: string
}>()

const module = useModule(BottomBacklinkModuleName)
const moduleOptions = computed(() => module.value.options as BottomBacklinkModuleOptions)

const docBacklinks = computed(() => props.backlinks)
const blockBackLinks = computed(() => props.blockBacklinks)
const currentDocId = computed(() => props.currentDocId)

const backlinkDocTreeStruct = ref([])
const backlinkFlatTree = ref([])
const backlinkTreePathChains = ref([])

const backlinkBlockRefNodes = ref<Node[]>([])

watch(currentDocId, () => {
  backlinkDocTreeStruct.value = []
  backlinkFlatTree.value = []
  backlinkTreePathChains.value = []
  backlinkBlockRefNodes.value = []
}, { immediate: true })

const getBlockRefsInDoc = async (ids: string[]) => {
  let sqlStmt = `
    select
      def_block_id as id,
      content as name
    from refs where block_id in (
      ${ids.map(i => `'${i}'`).join(', ')}
    ) group by def_block_id
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
    blockBacklinksTemp.forEach((b) => {
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

watch([props.backlinks, props.blockBacklinks], debounce(() => {
  getTreeStruct()
}, 10), { immediate: true })


const properties = ref<{
  [key: string]: {
    include: boolean;
    origin: Node;
  }
}>({})


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
  list.filter((blockRef) => {
    return validBacklinkTreePathChain.value.some((chain) => {
      return chainHasRefNode(chain, blockRef)
    })
  })

  return list
})
const sortedRemainRefs = computed(() => {
  const list = remainRefs.value
  list.sort((a, b) => {
    console.log('Number(linkNumMap[a.id]) is ', linkNumMap.value[a.id])
    console.log('Number(linkNumMap[b.id]) is ', linkNumMap.value[b.id])
    return Number(linkNumMap.value[b.id]) - Number(linkNumMap.value[a.id])
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
        return chainHasTargetBlockRefId(chain, node.id) && hasTargetBlockRef(lastInChain._markdown, node.id)
      })

      num = validChainList.length
    }
    map[node.id] = num || ''
  })
  return map
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

      .optionName {
        overflow: hidden;
        text-overflow: ellipsis;
      }
    }
  }
}
</style>
