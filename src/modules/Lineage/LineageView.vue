<!-- eslint-disable vue/require-v-for-key -->
<template>
  <div
    class="EnLineageViewContainer"
    ref="viewRef"
    :class="{
      'bg-dots': backgroundVariant === 'dots',
      'bg-lines': backgroundVariant === 'lines',
      'bg-none': backgroundVariant === 'none'
    }"
  >
    <div
      class="EnLineageViewScrollArea"
    >
      <div
        class="LineageCol"
        v-for="(col, colIndex) of processedLineageData"
      >
          <div class="ColPadding"></div>
          <div
            :class="[
              'LineageCell',
              `${isParentCell(cell.id) || isSlideCell(cell.id) ? 'level_second' : ''}`,
              `${isChildCell(cell.id) || currentCellId === cell.id ? 'level_first' : ''}`,
              `node-type-${cell.type || 'default'}`
              ].join(' ')
            "
            v-for="cell of col"
            :data-en_lineage_cell_id="cell.id"
            @click="recursiveScrollByCell(cell, colIndex)"
          >
            <div class="LineageCellContent">
              <div class="CellTitle">{{ getCellTitle(cell) }}</div>
              <div class="CellType">{{ getCellType(cell) }}</div>
              
              <!-- 新增思源块内容渲染区域 -->
              <div 
                v-if="cell.data?.blockId" 
                class="CellBlockContent"
                :class="{ 'is-expanded': expandedCellIds.includes(cell.id) }"
              >
                <div v-if="expandedCellIds.includes(cell.id)" class="ProtyleWrapper">
                  <EnProtyle 
                    :block-id="cell.data.blockId" 
                    disableEnhance
                    @after="protyle => handleProtyleLoaded(protyle, cell.id)"
                  />
                </div>
                <div class="BlockExpandButton" @click.stop="toggleCellExpand(cell.id)">
                  {{ expandedCellIds.includes(cell.id) ? '收起' : '展开' }}
                </div>
              </div>
            </div>
          </div>
          <div class="ColPadding"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { EN_CONSTANTS } from '@/utils/Constants';
import EnProtyle from '@/components/EnProtyle.vue';

const props = defineProps<{
  nodeId: string
  backgroundVariant?: 'dots' | 'lines' | 'none'
  whiteBoardNodes?: any[]
}>()

// 存储已展开的单元格ID
const expandedCellIds = ref<string[]>([]);

// 切换单元格内容展开/收起状态
const toggleCellExpand = (cellId: string) => {
  const index = expandedCellIds.value.indexOf(cellId);
  if (index === -1) {
    expandedCellIds.value.push(cellId);
  } else {
    expandedCellIds.value.splice(index, 1);
  }
};

// 处理EnProtyle加载完成后的回调
const handleProtyleLoaded = (protyle, cellId) => {
  // 可以在这里处理EnProtyle加载后的逻辑
  // 例如：调整高度、添加特殊样式等
  console.log('Protyle loaded for cell:', cellId);
};

// 转换白板节点到血统图数据结构
const processedLineageData = computed(() => {
  if (!props.whiteBoardNodes || props.whiteBoardNodes.length === 0) {
    return defaultLineageData.value;
  }
  
  // 创建节点映射以便快速查找
  const nodeMap = new Map();
  props.whiteBoardNodes.forEach(node => {
    nodeMap.set(node.id, {
      ...node,
      children: [],
      processed: false, // 标记是否已处理
      type: node.type || 'default'
    });
  });
  
  // 获取所有Frame节点
  const frameNodes = props.whiteBoardNodes.filter(node => 
    node.type === EN_CONSTANTS.EN_WHITE_BOARD_NODE_TYPE_FRAME
  );
  
  // 对Frame按面积从大到小排序，确保先处理较大的Frame
  const sortedFrames = [...frameNodes].sort((a, b) => {
    const areaA = (a.width || 0) * (a.height || 0);
    const areaB = (b.width || 0) * (b.height || 0);
    return areaB - areaA; // 从大到小排序
  });
  
  // 遍历所有节点，构建父子关系
  props.whiteBoardNodes.forEach(node => {
    const nodeObj = nodeMap.get(node.id);
    
    // 如果是Frame节点，寻找它的父Frame
    if (node.type === EN_CONSTANTS.EN_WHITE_BOARD_NODE_TYPE_FRAME) {
      // 找出包含当前Frame的最小Frame（如果有）
      let parentFrame = null;
      let smallestArea = Infinity;
      
      for (const frame of sortedFrames) {
        if (frame.id === node.id) continue; // 跳过自己
        
        if (isNodeInFrame(node, frame)) {
          const area = (frame.width || 0) * (frame.height || 0);
          if (area < smallestArea) {
            smallestArea = area;
            parentFrame = frame;
          }
        }
      }
      
      // 如果找到父Frame，建立关系
      if (parentFrame) {
        const parentObj = nodeMap.get(parentFrame.id);
        nodeObj.parent_id = parentFrame.id;
        parentObj.children.push(nodeObj);
        nodeObj.processed = true;
      }
    } else {
      // 如果是普通节点，寻找包含它的最小Frame
      let containingFrame = null;
      let smallestArea = Infinity;
      
      for (const frame of sortedFrames) {
        if (isNodeInFrame(node, frame)) {
          const area = (frame.width || 0) * (frame.height || 0);
          if (area < smallestArea) {
            smallestArea = area;
            containingFrame = frame;
          }
        }
      }
      
      // 如果找到包含的Frame，建立关系
      if (containingFrame) {
        const frameObj = nodeMap.get(containingFrame.id);
        nodeObj.parent_id = containingFrame.id;
        frameObj.children.push(nodeObj);
        nodeObj.processed = true;
      }
    }
  });
  
  // 找出没有被处理过的顶层节点
  const topLevelNodes = Array.from(nodeMap.values()).filter(node => !node.processed && !node.parent_id);
  
  // 创建一个树形结构
  const tree = topLevelNodes;
  
  // 将树形结构转换为分层结构
  const result = [];
  
  // 递归填充结果数组
  const fillResult = (nodes, level = 0) => {
    if (!nodes || nodes.length === 0) return;
    
    // 确保结果数组有足够的层级
    if (!result[level]) {
      result[level] = [];
    }
    
    // 添加当前层级的节点
    result[level].push(...nodes);
    
    // 处理每个节点的子节点
    nodes.forEach(node => {
      if (node.children && node.children.length > 0) {
        fillResult(node.children, level + 1);
      }
    });
  };
  
  // 从顶层节点开始填充
  fillResult(tree);
  
  return result.length > 0 ? result : defaultLineageData.value;
});

// 判断一个节点是否在Frame内
function isNodeInFrame(node, frameNode) {
  if (frameNode.type !== EN_CONSTANTS.EN_WHITE_BOARD_NODE_TYPE_FRAME) {
    return false;
  }
  
  // 检查节点是否在Frame的范围内
  const frameX = frameNode.position?.x || 0;
  const frameY = frameNode.position?.y || 0;
  const frameWidth = frameNode.width || 0;
  const frameHeight = frameNode.height || 0;
  
  const nodeX = node.position?.x || 0;
  const nodeY = node.position?.y || 0;
  const nodeWidth = node.width || 0;
  const nodeHeight = node.height || 0;
  
  return (
    nodeX >= frameX && 
    nodeY >= frameY && 
    nodeX + nodeWidth <= frameX + frameWidth && 
    nodeY + nodeHeight <= frameY + frameHeight
  );
}

// 获取节点标题
const getCellTitle = (cell) => {
  if (cell.data?.displayText) {
    return cell.data.displayText;
  }
  
  if (cell.data?.blockId) {
    return cell.data.blockId.substring(0, 8) + '...';
  }
  
  return cell.id.substring(0, 8) + '...';
};

// 获取节点类型
const getCellType = (cell) => {
  if (cell.type === EN_CONSTANTS.EN_WHITE_BOARD_NODE_TYPE_FRAME) {
    return '框架';
  } else if (cell.type === EN_CONSTANTS.EN_WHITE_BOARD_NODE_TYPE_PROTYLE) {
    return '内容块';
  } else if (cell.type === EN_CONSTANTS.EN_WHITE_BOARD_NODE_TYPE_TREECARD) {
    return '树形卡片';
  } else if (cell.type === EN_CONSTANTS.EN_WHITE_BOARD_NODE_TYPE_MINDMAP) {
    return '思维导图';
  }
  
  return '默认';
};

// 保留原有测试数据作为默认值
const defaultTestData = ref([
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
])

const defaultLineageData = computed(() => {
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

  recursive(defaultTestData.value)
  return result;
})

// 监听白板节点变化
watch(() => props.whiteBoardNodes, () => {
  // 当白板节点变化时，重置选择状态
  parentIdList.value = [];
  slideIdList.value = [];
  childrenIdList.value = [];
  
  // 清理已展开的节点状态 - 只保留在新节点列表中仍然存在的节点
  if (props.whiteBoardNodes && props.whiteBoardNodes.length > 0) {
    const existingNodeIds = props.whiteBoardNodes.map(node => node.id);
    expandedCellIds.value = expandedCellIds.value.filter(id => 
      existingNodeIds.includes(id)
    );
  } else {
    // 如果没有节点了，清空展开状态
    expandedCellIds.value = [];
  }
  
  // 重置当前选中的节点
  currentCellId.value = '';
  
  // 如果有数据，自动选中第一个节点
  if (processedLineageData.value.length > 0 && 
      processedLineageData.value[0].length > 0) {
    const firstNode = processedLineageData.value[0][0];
    recursiveScrollByCell(firstNode, 0);
  }
}, { immediate: true });

const viewRef = ref()
const scollToCell = (target: HTMLElement) => {
  if (!target) return;
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
  const parentCol = processedLineageData.value[index]
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
  if (!node) return;

  parentIdList.value = []
  slideIdList.value = []
  childrenIdList.value = []

  const col = processedLineageData.value[colIndex]
  currentCellId.value = node.id

  let parentColIndex = colIndex - 1
  let parentNode = getParentNodeByNodeAndColIndex(node, parentColIndex)
  
  // 找到父级，按 children 记录兄弟
  if (parentNode) {
    // 记录所有兄弟节点
    parentNode.children?.forEach((child) => {
      if (child.id !== node.id) {
        slideIdList.value.push(child.id)
      }
    })
    
    parentIdList.value.push(parentNode.id)

    // 递归查 parentId
    while(parentColIndex > 0) {
      parentColIndex -= 1
      parentNode = getParentNodeByNodeAndColIndex(parentNode, parentColIndex)
      if (parentNode) {
        parentIdList.value.push(parentNode.id)
      }
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

  // 滚动到相关节点
  parentIdList.value.forEach((id) => {
    scrollToCellById(id)
  })
  childrenIdList.value.forEach((id) => {
    scrollToCellById(id)
  })
  scrollToCellById(currentCellId.value)
  
  // 如果节点有blockId，自动展开该节点的内容
  if (node.data?.blockId) {
    // 先收起所有其他展开的节点
    expandedCellIds.value = expandedCellIds.value.filter(id => 
      id === node.id || !isNodeVisible(id)
    );
    
    // 如果当前节点没有展开，则展开它
    if (!expandedCellIds.value.includes(node.id)) {
      expandedCellIds.value.push(node.id);
      
      // 给渲染一些时间后再次滚动到位置
      setTimeout(() => {
        scrollToCellById(currentCellId.value);
      }, 100);
    }
  }
}

// 检查节点是否在当前视图中可见
const isNodeVisible = (nodeId) => {
  return [
    currentCellId.value,
    ...parentIdList.value,
    ...slideIdList.value,
    ...childrenIdList.value
  ].includes(nodeId);
}

const scrollToCellById = (id: string) => {
  const cellDom = viewRef.value?.querySelector(`.LineageCell[data-en_lineage_cell_id="${id}"]`)
  if (cellDom) {
    scollToCell(cellDom)
  }
}

const scrollToCol = (col: HTMLDivElement) => {
  if (viewRef.value && col) {
    viewRef.value.scrollLeft = col.offsetLeft - (viewRef.value.clientWidth / 2) + (col.clientWidth / 2)
  }
}

onMounted(() => {
  // 如果有数据，自动选中第一个节点
  if (processedLineageData.value.length > 0 && 
      processedLineageData.value[0].length > 0) {
    const firstNode = processedLineageData.value[0][0];
    recursiveScrollByCell(firstNode, 0);
  }
})
</script>

<style lang="scss" scoped>
.EnLineageViewContainer {
  position: absolute;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: var(--b3-theme-background);
  overflow-x: auto;
  overflow-y: hidden;
  
  // 白板背景样式
  &.bg-dots {
    background-image: radial-gradient(var(--b3-border-color) 1px, transparent 0);
    background-size: 48px 48px;
    background-position: 0 0;
  }
  
  &.bg-lines {
    background-image: 
      linear-gradient(to right, var(--b3-border-color) 1px, transparent 1px),
      linear-gradient(to bottom, var(--b3-border-color) 1px, transparent 1px);
    background-size: 48px 48px;
  }


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

      overflow-y: auto;
      overflow-x: hidden;

      display: flex;
      flex-direction: column;

      font-size: 14px;
      font-weight: normal;

      &::-webkit-scrollbar {
        display: none;
      }

      .ColPadding {
        width: 100%;
        height: calc(50% - var(--lineage-cell-height) / 2);
        flex-shrink: 0;
        flex-grow: 0;
      }

      .LineageCell {
        width: 100%;
        min-height: var(--lineage-cell-height);
        box-sizing: border-box;
        flex-shrink: 0;
        flex-grow: 0;
        margin: 8px;
        border-radius: 4px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        padding: 16px;
        background-color: var(--b3-theme-surface);
        border: 1px solid var(--b3-border-color);
        cursor: pointer;
        transition: all 0.3s ease;
        
        &:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        }

        &.level_first {
          background-color: var(--b3-theme-primary-light);
          border-color: var(--b3-theme-primary);
        }

        &.level_second {
          background-color: var(--b3-theme-surface-light);
        }
        
        &.node-type-EnWhiteBoardNodeFrame {
          border-style: dashed;
          border-width: 2px;
          background-color: rgba(var(--primary-2), 0.5);
        }
        
        .LineageCellContent {
          display: flex;
          flex-direction: column;
          height: 100%;
          
          .CellTitle {
            font-weight: bold;
            margin-bottom: 8px;
            word-break: break-all;
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
            text-overflow: ellipsis;
          }
          
          .CellType {
            font-size: 12px;
            color: var(--b3-theme-on-surface);
            margin-bottom: 6px;
            opacity: 0.8;
          }
          
          .CellBlockContent {
            margin-top: 10px;
            transform-origin: top center;
            transition: all 0.3s ease;
            
            &.is-expanded {
              animation: fadeIn 0.3s ease-in-out;
            }
          }
        }
      }
    }
  }
}

// 添加淡入动画效果
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>

<style lang="scss">
// LineageView 中思源块内容的样式
.CellBlockContent {
  margin-top: 12px;
  border-top: 1px solid var(--b3-border-color);
  position: relative;
  
  .ProtyleWrapper {
    margin-top: 8px;
    max-height: 300px;
    overflow-y: auto;
    background-color: var(--b3-theme-background);
    border-radius: 4px;
    
    &::-webkit-scrollbar {
      width: 4px;
      height: 4px;
    }
    
    &::-webkit-scrollbar-thumb {
      background-color: var(--b3-scroll-color);
    }
    
    &:hover::-webkit-scrollbar-thumb {
      background-color: var(--b3-scroll-hover-color);
    }
    
    :deep(.protyle) {
      min-height: 0 !important;
      
      .protyle-wysiwyg {
        padding: 8px !important;
        padding-bottom: 16px !important;
        min-height: 0 !important;
      }
      
      .protyle-content {
        padding-bottom: 0;
      }
    }
  }
  
  .BlockExpandButton {
    cursor: pointer;
    user-select: none;
    font-size: 12px;
    color: var(--b3-theme-primary);
    text-align: center;
    padding: 4px 0;
    margin-top: 4px;
    
    &:hover {
      color: var(--b3-theme-on-primary);
      background-color: var(--b3-theme-primary-light);
      border-radius: 4px;
    }
  }
  
  // 展开状态特殊样式
  &.is-expanded {
    .BlockExpandButton {
      border-top: 1px solid var(--b3-border-color);
    }
  }
}
</style>
