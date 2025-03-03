<template>
  <div class="memo-actions" :class="{ 'memo-actions--vertical': isVertical }">
    <div class="action-group">
      <button
        class="filter-btn"
        :class="{ active: modelValue === 'daily' }"
        @click="toggleFilter('daily')"
      >
        <svg class="action-icon"><use xlink:href="#iconCalendar"></use></svg>
        <span class="btn-text">日记</span>
      </button>
      <button
        class="filter-btn"
        :class="{ active: modelValue === 'whiteboard' }"
        @click="toggleFilter('whiteboard')"
      >
        <svg class="action-icon"><use xlink:href="#iconLayout"></use></svg>
        <span class="btn-text">白板</span>
      </button>
      <button
        class="filter-btn"
        :class="{ active: modelValue === 'annotation' }"
        @click="toggleFilter('annotation')"
      >
        <svg class="action-icon"><use xlink:href="#iconMark"></use></svg>
        <span class="btn-text">批注</span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { request } from '@/api'
import { useDailyNote } from '@/modules/DailyNote/DailyNote'
import {
  type EnWhiteBoardConfig,
  getWhiteBoardConfigRefById,
  loadWhiteBoard,
  loadWhiteBoardConfigById,
  useWhiteBoardModule,
  whiteBoardRef,
} from '@/modules/EnWhiteBoard/EnWhiteBoard'
import {
  onMounted,
  watch,
} from 'vue'

export type FilterType = 'daily' | 'whiteboard' | 'annotation'

const props = defineProps<{
  modelValue?: FilterType
  isVertical?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: FilterType | undefined): void
  (e: 'dailyNoteInfo', value: { dailyNotes: any[] }): void
}>()

// 切换筛选器
const toggleFilter = (filter: FilterType) => {
  if (props.modelValue === filter) {
    // 如果已经选中，则取消选中
    emit('update:modelValue', undefined)
  } else {
    // 否则选中
    emit('update:modelValue', filter)
  }
}

// 监听 props 变化
watch(() => props.modelValue, async (newValue) => {
  if (!newValue) {
    // 如果状态被清空，也清空日记信息
    emit('dailyNoteInfo', { dailyNotes: [] })
    return
  }

  // 加载对应类型的数据
  try {
    let notes = []
    if (newValue === 'daily') {
      notes = await getDailyNotes() || []
      console.log('Daily notes loaded:', notes)
    } else if (newValue === 'whiteboard') {
      notes = await getWhiteboardNotes() || []
      console.log('Whiteboard notes loaded:', notes)
    } else if (newValue === 'annotation') {
      notes = await getAnnotationNotes() || []
      console.log('Annotation notes loaded:', notes)
    }
    emit('dailyNoteInfo', { dailyNotes: notes })
  } catch (err) {
    console.error(`Failed to get ${newValue} notes:`, err)
    emit('dailyNoteInfo', { dailyNotes: [] })
  }
}, { immediate: true })

// 递归获取父块ID
async function getParentBlockIds(blockId: string, parentId: string | null): Promise<string[]> {
  if (!parentId || parentId === blockId) {
    return [blockId]
  }

  const data = {
    stmt: `
      SELECT
        id,
        parent_id,
        root_id,
        type
      FROM blocks
      WHERE id = '${parentId}'
    `,
  }

  try {
    const result = await request('/api/query/sql', data)
    if (result && result.length > 0) {
      const block = result[0]
      // 如果是文档块或parent_id等于root_id或为空，说明已经到达顶层
      if (block.type === 'd' || !block.parent_id || block.parent_id === block.root_id) {
        return [blockId]
      }
      // 否则继续递归查找
      const parentIds = await getParentBlockIds(block.id, block.parent_id)
      return [blockId, ...parentIds]
    }
  } catch (err) {
    console.error('Failed to get parent block:', err)
  }
  return [blockId]
}

// 获取日记块
async function getDailyNotes() {
  const { moduleOptions } = useDailyNote()
  const notebookId = moduleOptions.value.dailyNoteNotebookId

  if (!notebookId) {
    return []
  }

  // 先获取日记文档
  const data = {
    stmt: `
      WITH daily_docs AS (
        SELECT
          B.id as doc_id,
          A.value as date_value
        FROM blocks B
        JOIN attributes A ON B.id = A.block_id
        WHERE
          B.box = '${notebookId}'
          AND B.type = 'd'
          AND A.name LIKE 'custom-dailynote-%'
      )
      SELECT
        C.id as block_id,
        C.content as block_content,
        C.root_id as doc_id,
        C.updated as block_time,
        D.date_value,
        C.parent_id,
        C.type as block_type
      FROM blocks C
      JOIN daily_docs D ON C.root_id = D.doc_id
      WHERE
        C.type != 'd'
        AND C.content != ''
        AND C.id != C.root_id
      ORDER BY D.date_value DESC, C.updated DESC
    `,
  }
  const result = await request('/api/query/sql', data)
  console.log('Initial SQL result:', result)

  // 创建一个映射来跟踪每个块的子块
  const blockChildrenMap = new Map<string, string[]>()
  
  // 首先构建父子关系映射
  result.forEach((item: any) => {
    if (item.parent_id) {
      if (!blockChildrenMap.has(item.parent_id)) {
        blockChildrenMap.set(item.parent_id, [])
      }
      blockChildrenMap.get(item.parent_id)?.push(item.block_id)
    }
  })
  
  // 找出所有顶级块（直接在文档下的块）
  const topLevelBlocks = result.filter((item: any) => {
    // 检查父块是否为文档块
    return !item.parent_id || item.parent_id === item.doc_id || 
           result.findIndex((b: any) => b.block_id === item.parent_id) === -1
  })
  
  console.log('Top level blocks:', topLevelBlocks.length)
  
  // 处理顶级块，获取其内容
  const processedResults = await Promise.all(
    topLevelBlocks.map(async (item: any) => {
      return {
        ...item,
        block_id: item.block_id,
        original_block_id: item.block_id,
      }
    })
  )
  
  console.log('Final processed results:', processedResults.length)
  return processedResults
}

// 获取白板块
async function getWhiteboardNotes() {
  // 确保白板模块已初始化
  if (!whiteBoardRef.indexMap) {
    console.log('初始化白板模块...')
    loadWhiteBoard()
    await new Promise((resolve) => setTimeout(resolve, 100)) // 等待初始化完成
  }

  if (!whiteBoardRef.indexMap) {
    console.log('白板列表为空')
    return []
  }

  // 获取所有白板
  const whiteboards = Object.values(whiteBoardRef.indexMap.moduleOptions.value)

  // 先加载所有白板的配置
  const configPromises = whiteboards.map(async (item) => {
    const { embedWhiteBoardConfigData } = getWhiteBoardConfigRefById(item.whiteBoardId, 'default')
    if (!embedWhiteBoardConfigData.value?.loaded) {
      console.log('加载白板配置:', item.whiteBoardId)
      const defaultConfig: EnWhiteBoardConfig = {
        id: item.whiteBoardId,
        name: item.whiteBoardName,
        loaded: true,
        embedOptions: {
          default: {
            height: 200,
            SiderLeftShow: false,
            SiderLeftWidth: 0,
            SiderRightShow: false,
            SiderRightWidth: 0,
          },
        },
        boardOptions: {
          keepEmbedOptionsSame: false,
          nodes: [],
          edges: [],
          viewport: {
            x: 0,
            y: 0,
            zoom: 1,
          },
          backgroundVariant: 'none',
          useCustomBackground: false,
        },
      }
      await loadWhiteBoardConfigById(item.whiteBoardId, defaultConfig)
      // 等待一下确保配置加载完成
      await new Promise((resolve) => setTimeout(resolve, 50))
    }
  })

  await Promise.all(configPromises)

  // 详细打印白板信息
  console.group('白板列表')
  whiteboards.forEach((item) => {
    console.log('----------------------------------------')
    console.log('白板ID:', item.whiteBoardId)
    console.log('白板名称:', item.whiteBoardName)
    const { embedWhiteBoardConfigData } = getWhiteBoardConfigRefById(item.whiteBoardId, 'default')
    if (embedWhiteBoardConfigData.value) {
      console.log('白板配置:', embedWhiteBoardConfigData.value)
    }
  })
  console.log('----------------------------------------')
  console.log(`共找到 ${whiteboards.length} 个白板`)
  console.groupEnd()

  // 格式化白板数据
  const formattedWhiteboards = whiteboards.map((item) => {
    const { embedWhiteBoardConfigData } = getWhiteBoardConfigRefById(item.whiteBoardId, 'default')
    // 从白板ID中提取时间
    const timeStr = item.whiteBoardId.split('-')[3] || ''
    const time = timeStr
      ? `${timeStr.slice(0, 4)}-${timeStr.slice(4, 6)}-${timeStr.slice(6, 8)} ${timeStr.slice(8, 10)}:${timeStr.slice(10, 12)}:${timeStr.slice(12, 14)}`
      : new Date().toLocaleString()

    // 详细打印白板配置
    console.group('白板配置详情')
    console.log('白板ID:', item.whiteBoardId)
    console.log('白板名称:', item.whiteBoardName)
    if (embedWhiteBoardConfigData.value) {
      console.log('节点数量:', embedWhiteBoardConfigData.value.boardOptions.nodes.length)
      console.log('边数量:', embedWhiteBoardConfigData.value.boardOptions.edges.length)
      console.log('视口信息:', embedWhiteBoardConfigData.value.boardOptions.viewport)
      console.log('完整配置:', embedWhiteBoardConfigData.value)
    } else {
      console.log('配置为空')
    }
    console.groupEnd()

    const memo = {
      blockId: item.whiteBoardId,
      time,
      type: 'whiteboard',
      docPath: item.whiteBoardName || '未命名白板',
      whiteBoardConfig: embedWhiteBoardConfigData.value,
    }

    return memo
  })

  return formattedWhiteboards
}

// 获取批注块
async function getAnnotationNotes() {
  const data = {
    stmt: `
      SELECT
        B.id as block_id,
        B.content as block_content,
        B.root_id as doc_id,
        B.updated as block_time,
        B.parent_id,
        D.hpath as doc_path
      FROM blocks B
      JOIN blocks D ON B.root_id = D.id
      WHERE
        B.type = 'widget'
        AND B.content LIKE '%sy-enhance-annotation%'
      ORDER BY B.updated DESC
    `,
  }
  const result = await request('/api/query/sql', data)
  console.log('Initial annotation SQL result:', result)
  return result
}

// 确保白板模块在组件挂载时初始化
onMounted(() => {
  const { moduleOptions } = useWhiteBoardModule()
  if (moduleOptions.value.enabled && !whiteBoardRef.indexMap) {
    loadWhiteBoard()
  }
  // 自动加载日记数据
  if (props.modelValue === 'daily') {
    getDailyNotes().then((notes) => {
      emit('dailyNoteInfo', { dailyNotes: notes })
    })
  }
})
</script>

<style lang="scss">
.memo-actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  
  &--vertical {
    flex-direction: column;
    
    .action-group {
      flex-direction: column;
      width: 100%;
      
      .filter-btn {
        width: 100%;
        justify-content: flex-start;
        text-align: left;
        padding: 8px 12px;
      }
    }
  }

  .action-group {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .filter-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border-radius: var(--b3-border-radius);
    background-color: var(--b3-theme-surface);
    border: 1px solid var(--b3-theme-surface-lighter);
    cursor: pointer;
    transition: all 0.2s ease;
    font-size: 12px;
    color: var(--b3-theme-on-surface);

    &:hover {
      background-color: var(--b3-theme-surface-lighter);
    }

    &.active {
      background-color: var(--b3-theme-primary-lightest);
      border-color: var(--b3-theme-primary-light);
      color: var(--b3-theme-primary);

      .action-icon {
        fill: var(--b3-theme-primary);
      }
    }

    .action-icon {
      width: 14px;
      height: 14px;
      fill: var(--b3-theme-on-surface);
    }
  }
}
</style>
