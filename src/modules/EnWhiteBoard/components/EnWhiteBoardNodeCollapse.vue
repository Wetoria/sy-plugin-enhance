<template>
  <div class="EnWhiteBoardNodeCollapse">
    <!-- 此组件不提供UI，仅提供折叠功能逻辑 -->
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useVueFlow } from '@vue-flow/core'

const props = defineProps({
  nodeId: {
    type: String,
    required: true
  },
  initialCollapsed: {
    type: Boolean,
    default: false
  },
  whiteBoardConfigData: {
    type: Object,
    default: null
  },
  collapsedHeight: {
    type: Number,
    default: 30
  }
})

const emit = defineEmits(['update:isCollapsed'])

const { getNodes, getEdges, setNodes, setEdges } = useVueFlow()

const isCollapsed = ref(false)

// 初始化折叠状态
onMounted(() => {
  // 从节点数据或props中获取折叠状态
  const nodes = getNodes.value
  const currentNode = nodes.find(node => node.id === props.nodeId)
  
  if (currentNode) {
    isCollapsed.value = currentNode.data?.isCollapsed || props.initialCollapsed
    
    // 确保节点高度数据正确
    const newNodes = nodes.map((node) => {
      if (node.id === props.nodeId) {
        // 如果是折叠状态，设置高度为collapsedHeight
        if (isCollapsed.value && node.height !== props.collapsedHeight) {
          // 确保保存真实高度
          const nodeOriginalHeight = 
            node.data?.originalHeight || 
            node.height || 
            node.dimensions?.height || 
            200;
            
          return {
            ...node,
            data: {
              ...node.data,
              isCollapsed: isCollapsed.value,
              originalHeight: nodeOriginalHeight, // 保存当前高度
            },
            height: props.collapsedHeight, // 折叠时固定高度
            style: { 
              ...(typeof node.style === 'object' ? node.style : {}), 
              height: `${props.collapsedHeight}px` 
            },
            dimensions: {
              ...(node.dimensions || {}),
              height: props.collapsedHeight
            }
          }
        } 
        // 如果是展开状态，确保保存了原始高度
        else if (!isCollapsed.value) {
          // 确保节点有原始高度记录
          const hasOriginalHeight = !!node.data?.originalHeight;
          const nodeCurrentHeight = node.height || node.dimensions?.height || 200;
          
          return {
            ...node,
            data: {
              ...node.data,
              isCollapsed: isCollapsed.value,
              // 如果已有原始高度则保留，否则保存当前高度
              originalHeight: hasOriginalHeight ? node.data.originalHeight : nodeCurrentHeight,
            },
            // 如果之前折叠过，需要恢复原始高度
            height: hasOriginalHeight ? node.data.originalHeight : nodeCurrentHeight,
            style: { 
              ...(typeof node.style === 'object' ? node.style : {}), 
              height: `${hasOriginalHeight ? node.data.originalHeight : nodeCurrentHeight}px` 
            },
            dimensions: {
              ...(node.dimensions || {}),
              height: hasOriginalHeight ? node.data.originalHeight : nodeCurrentHeight
            }
          }
        }
      }
      return node
    })
    setNodes(newNodes)
    
    // 通知父组件折叠状态
    emit('update:isCollapsed', isCollapsed.value)
  }
})

// 监听初始折叠状态变化
watch(() => props.initialCollapsed, (newValue) => {
  if (newValue !== isCollapsed.value) {
    toggleCollapse()
  }
})

// 切换折叠状态
const toggleCollapse = () => {
  isCollapsed.value = !isCollapsed.value

  // 更新节点数据
  const nodes = getNodes.value
  const currentNode = nodes.find(node => node.id === props.nodeId);
  
  if (!currentNode) return;
  
  // 确保节点尺寸数据是最新的
  const updatedNode = {
    ...currentNode,
    data: {
      ...currentNode.data,
      isCollapsed: isCollapsed.value,
    }
  };
  
  // 根据折叠状态设置高度
  if (isCollapsed.value) {
    // 折叠：保存当前高度并设置为collapsedHeight
    // 确保保存当前的真实高度，而不是之前可能已保存的值
    updatedNode.data.originalHeight = currentNode.height || currentNode.dimensions?.height || 200;
    updatedNode.height = props.collapsedHeight;
    // 修改style对象，确保高度设置正确
    updatedNode.style = { 
      ...(typeof updatedNode.style === 'object' ? updatedNode.style : {}), 
      height: `${props.collapsedHeight}px` 
    };
    // 确保尺寸也正确设置
    if (updatedNode.dimensions) {
      updatedNode.dimensions.height = props.collapsedHeight;
    }
  } else {
    // 展开：恢复到原始高度
    // 使用保存的原始高度，如果没有则使用默认值
    const originalHeight = currentNode.data?.originalHeight || 
                          currentNode.dimensions?.height || 
                          200;
    
    updatedNode.height = originalHeight;
    
    // 修改style对象，确保高度设置正确
    updatedNode.style = { 
      ...(typeof updatedNode.style === 'object' ? updatedNode.style : {}), 
      height: `${originalHeight}px` 
    };
    
    // 确保尺寸也正确设置
    if (updatedNode.dimensions) {
      updatedNode.dimensions.height = originalHeight;
    }
  }
  
  // 更新节点
  const newNodes = nodes.map(node => 
    node.id === props.nodeId ? updatedNode : node
  );
  
  setNodes(newNodes);

  // 更新连线位置
  // 获取所有边
  const allEdges = getEdges.value;
  
  // 创建一个新的边数组，保留未修改的边
  const updatedAllEdges = allEdges.map(edge => {
    // 如果是需要更新的边，则更新它
    if (edge.source === props.nodeId || edge.target === props.nodeId) {
      const flowNode = currentNode;
      return {
        ...edge,
        source: edge.source,
        target: edge.target,
        // 根据新位置更新连线
        sourceX: edge.source === props.nodeId ? 
          flowNode.position.x + (isCollapsed.value ? 0 : (flowNode.dimensions?.width || 0)) : 
          edge.sourceX,
        sourceY: edge.source === props.nodeId ? flowNode.position.y : edge.sourceY,
        targetX: edge.target === props.nodeId ? flowNode.position.x : edge.targetX,
        targetY: edge.target === props.nodeId ? flowNode.position.y : edge.targetY,
      };
    }
    // 否则保留原边
    return edge;
  });
  
  // 更新所有边
  setEdges(updatedAllEdges);
  
  // 更新白板配置
  if (props.whiteBoardConfigData) {
    props.whiteBoardConfigData.boardOptions.nodes = newNodes;
    props.whiteBoardConfigData.boardOptions.edges = updatedAllEdges;
  }
  
  // 通知父组件折叠状态
  emit('update:isCollapsed', isCollapsed.value)
}

// 导出的方法
defineExpose({
  isCollapsed,
  toggleCollapse
})
</script>

<style lang="scss" scoped>
.EnWhiteBoardNodeCollapse {
  display: none; // 不显示任何内容，仅提供功能
}
</style>
