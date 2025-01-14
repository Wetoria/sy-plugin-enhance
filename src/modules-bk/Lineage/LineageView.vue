<!-- eslint-disable vue/require-v-for-key -->
<template>
  <div
    class="EnLineageViewContainer"
    ref="viewRef"
  >
    <div
      class="EnLineageViewScrollArea"
    >
      <div
        class="LineageCol"
        v-for="(col, colIndex) of lineageData"
      >
          <div class="ColPadding"></div>
          <div
            :class="[
              'LineageCell',
              `${isParentCell(cell.id) || isSlideCell(cell.id) ? 'level_second' : ''}`,
              `${isChildCell(cell.id) || currentCellId === cell.id ? 'level_first' : ''}`
              ].join(' ')
            "
            v-for="cell of col"
            :data-en_lineage_cell_id="cell.id"
            @click="recursiveScrollByCell(cell, colIndex)"
          >
            <div>
              {{ cell.id }}
            </div>
          </div>
          <div class="ColPadding"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';

defineProps<{
  nodeId: string
}>()

const testData = ref([
  {
    id: 1,
    children: [
      {
        id: 4,
        parent_id: 1,
        children: [
          // {
          //   id: 8,
          //   parent_id: 4,
          // },
          // {
          //   id: 9,
          //   parent_id: 4,
          // },
        ],
      },
      {
        id: 5,
        parent_id: 1,
      },
    ],
  },
  {
    id: 2,
    children: [
      // {
      //   id: 6,
      //   parent_id: 2,
      // },
      // {
      //   id: 7,
      //   parent_id: 2,
      // },
    ],
  },
  {
    id: 3,
  },
])

const lineageData = computed(() => {
  const result = []
  const recursive = (list, level = 1) => {
    if (!list || !list.length) return

    list.forEach((item) => {
      const col = result[level - 1] || []
      col.push(item)
      result[level - 1] = col
      recursive(item.children, level + 1)
    })
  }

  recursive(testData.value)
  return result;
})

console.log('lineageData is ', lineageData.value)

const viewRef = ref()
const scollToCell = (target: HTMLElement) => {
  console.log('cell is ', target)
  let node = target
  while (node && !node?.classList?.contains('LineageCell')) {
    node = node.parentElement as HTMLDivElement
  }
  const cell = node
  const col = cell.parentElement as HTMLDivElement
  scrollToCol(col)
  col.scrollTop = cell.offsetTop - (col.clientHeight / 2) + (cell.clientHeight / 2)
}

const parentIdList = ref([])
const slideIdList = ref([])
const childrenIdList = ref([])

const getParentNodeByNodeAndColIndex = (node, index) => {
  const parentCol = lineageData.value[index]
  if (!parentCol) {
    return
  }
  const parentNode = parentCol.find((item) => item.id === node.parent_id)
  return parentNode
}

const isParentCell = (id) => {
  return parentIdList.value.find(i => i === id)
}
const isSlideCell = (id) => {
  return slideIdList.value.find(i => i === id)
}
const isChildCell = (id) => {
  return childrenIdList.value.find(i => i === id)
}


const currentCellId = ref('')
const recursiveScrollByCell = (node, colIndex) => {

  parentIdList.value = []
  slideIdList.value = []
  childrenIdList.value = []

  const col = lineageData.value[colIndex]
  currentCellId.value = node.id

  let parentColIndex = colIndex - 1
  let parentNode = getParentNodeByNodeAndColIndex(node, parentColIndex)
  console.log('parentNode is ', parentNode)
  // 找到父级，按 children 记录兄弟
  if (parentNode) {

    // 记录所有兄弟节点
    parentNode.children.forEach((child) => {
      if (child.id !== node.id) {
        slideIdList.value.push(child.id)
      }
    })
    console.log('pa id ', parentNode.id)
    parentIdList.value.push(parentNode.id)

    // 递归查 parentId
    while(parentColIndex > 0) {
      parentColIndex -= 1
      parentNode = getParentNodeByNodeAndColIndex(parentNode, parentColIndex)
      parentIdList.value.push(parentNode.id)
    }
  } else { // 否则取当前节点的其他节点
    col.forEach((item) => {
      if (item.id !== node.id) {
        slideIdList.value.push(item.id)
      }
    })
  }
  const recursive = (list) => {
    if (!list || !list.length) return

    list.forEach((item) => {
      childrenIdList.value.push(item.id)
      recursive(item.children)
    })
  }

  recursive(node.children)
  const index = col.find((item) => item.id === node.id)

  // below scroll to first, otherwise scroll to last
  const isBelow = index >= col.length / 2

  console.log('value is ', parentIdList.value, slideIdList.value, childrenIdList.value)

  parentIdList.value.forEach((id) => {
    scrollToCellById(id)
  })
  childrenIdList.value.forEach((id) => {
    scrollToCellById(id)
  })
  scrollToCellById(currentCellId.value)
}

const scrollToCellById = (id: string) => {
  const cellDom = viewRef.value.querySelector(`.LineageCell[data-en_lineage_cell_id="${id}"]`)
  scollToCell(cellDom)
}

const scrollToCol = (col: HTMLDivElement) => {
  viewRef.value.scrollLeft = col.offsetLeft - (viewRef.value.clientWidth / 2) + (col.clientWidth / 2)
}

onMounted(() => {
  console.log('viewRef.value.firstElementChild is ', viewRef.value.firstElementChild, viewRef.value)
  const firstCellNode = (lineageData.value[0] || [])[0]
  if (viewRef.value && firstCellNode) {
    // scrollToCellById(firstCellNode.id)
    recursiveScrollByCell(firstCellNode, 0)

    setTimeout(() => {
      testData.value = [
  {
    id: 1,
    children: [
      {
        id: 4,
        parent_id: 1,
        children: [
          {
            id: 8,
            parent_id: 4,
          },
          {
            id: 9,
            parent_id: 4,
          },
        ],
      },
      {
        id: 5,
        parent_id: 1,
      },
    ],
  },
  {
    id: 2,
    children: [
      {
        id: 6,
        parent_id: 2,
      },
      {
        id: 7,
        parent_id: 2,
      },
    ],
  },
  {
    id: 3,
  },
]
  setTimeout(() => {
    recursiveScrollByCell(firstCellNode, 0)
  }, 300)
    }, 2000)
  }
})
</script>

<style lang="scss" scoped>
.EnLineageViewContainer {
  position: absolute;
  top: 0;
  width: 100%;
  height: 100%;
  // background-color: var(--sky-blue-blur);
  background-color: var(--b3-theme-background);
  overflow-x: auto;
  overflow-y: hidden;


  .EnLineageViewScrollArea {
    display: flex;
    --lineage-col-width: 300px;
    --lineage-cell-height: 150px;
    height: 100%;
    width: fit-content;

    padding: 0 calc(100% - (var(--lineage-col-width) / 2));

    .LineageCol {
      height: 100%;
      width: var(--lineage-col-width);
      flex-shrink: 0;
      flex-grow: 0;
      // border: 1px solid black;

      overflow-y: auto;
      overflow-x: hidden;

      display: flex;
      flex-direction: column;

      color: red;
      font-size: 48px;
      font-weight: bold;

      &::-webkit-scrollbar {
        display: none;
      }

      .ColPadding {
        width: 100%;
        height: calc(100% - var(--lineage-cell-height));
        flex-shrink: 0;
        flex-grow: 0;
      }

      .LineageCell {
        width: 100%;
        min-height: var(--lineage-cell-height);
        // border: 1px solid red;
        box-sizing: border-box;
        flex-shrink: 0;
        flex-grow: 0;

        &.level_first {
          background-color: black;
        }

        &.level_second {
          background-color: white;
        }
      }
    }
  }
}
</style>

<style lang="scss">

</style>
