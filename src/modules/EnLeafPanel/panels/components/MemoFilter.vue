<template>
  <div class="memo-actions">
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
import { whiteBoardRef } from '@/modules/EnWhiteBoard/EnWhiteBoard'
import {
  watch,
} from 'vue'

export type FilterType = 'daily' | 'whiteboard' | 'annotation'

const props = defineProps<{
  modelValue?: FilterType
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: FilterType | undefined): void
  (e: 'dailyNoteInfo', value: { dailyNotes: any[] }): void
}>()

// 监听 props 变化
watch(() => props.modelValue, (newValue) => {
  if (!newValue) {
    // 如果状态被清空，也清空日记信息
    emit('dailyNoteInfo', { dailyNotes: [] })
  }
})

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
        C.parent_id
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

  // 处理每个块，获取其所有父块ID
  const processedResults = await Promise.all(
    result.map(async (item: any) => {
      const allParentIds = await getParentBlockIds(item.block_id, item.parent_id)
      console.log('Block ID:', item.block_id, 'All parent IDs:', allParentIds)
      // 使用最后一个ID（最顶层的父块ID）或原始ID
      const finalBlockId = allParentIds[allParentIds.length - 1] || item.block_id
      return {
        ...item,
        block_id: finalBlockId,
        original_block_id: item.block_id,
        all_parent_ids: allParentIds,
      }
    }),
  )

  // 对结果进行去重，确保每个最终的block_id只出现一次
  const uniqueResults = processedResults.reduce((acc: any[], current: any) => {
    const existingIndex = acc.findIndex((item) => item.block_id === current.block_id)
    if (existingIndex === -1) {
      // 如果这个block_id还没有出现过，添加到结果中
      acc.push(current)
    }
    return acc
  }, [])

  console.log('Final processed results:', uniqueResults)
  return uniqueResults
}

// 获取白板块
async function getWhiteboardNotes() {
  if (!whiteBoardRef.indexMap) {
    console.log('白板列表为空')
    return []
  }

  // 获取所有白板
  const whiteboards = Object.values(whiteBoardRef.indexMap.moduleOptions.value)
  const configList = whiteBoardRef.configList.value

  // 详细打印白板信息
  console.group('白板列表')
  whiteboards.forEach((item) => {
    console.log('----------------------------------------')
    console.log('白板ID:', item.whiteBoardId)
    console.log('白板名称:', item.whiteBoardName)
    const config = configList[item.whiteBoardId]
    if (config) {
      console.log('白板配置:', config.moduleOptions.value)
    }
  })
  console.log('----------------------------------------')
  console.log(`共找到 ${whiteboards.length} 个白板`)
  console.groupEnd()

  // 格式化白板数据
  const formattedWhiteboards = whiteboards.map((item) => {
    const config = configList[item.whiteBoardId]
    // 从白板ID中提取时间
    const timeStr = item.whiteBoardId.split('-')[3] || ''
    const time = timeStr
      ? `${timeStr.slice(0, 4)}-${timeStr.slice(4, 6)}-${timeStr.slice(6, 8)} ${timeStr.slice(8, 10)}:${timeStr.slice(10, 12)}:${timeStr.slice(12, 14)}`
      : new Date().toLocaleString()

    const memo = {
      blockId: item.whiteBoardId,
      time,
      type: 'whiteboard',
      docPath: item.whiteBoardName || '未命名白板',
      whiteBoardConfig: config?.moduleOptions.value,
    }

    console.log('格式化后的白板数据:', memo)
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

const toggleFilter = async (type: FilterType) => {
  if (props.modelValue === type) {
    emit('update:modelValue', undefined)
    // 清空信息
    emit('dailyNoteInfo', { dailyNotes: [] })
  } else {
    emit('update:modelValue', type)
    try {
      let notes = []
      if (type === 'daily') {
        notes = await getDailyNotes() || []
        console.log('Daily notes from database:', notes)
      } else if (type === 'whiteboard') {
        notes = await getWhiteboardNotes() || []
        console.log('Whiteboard notes from plugin:', notes)
      } else if (type === 'annotation') {
        notes = await getAnnotationNotes() || []
        console.log('Annotation notes from database:', notes)
      }

      // 发送信息
      emit('dailyNoteInfo', {
        dailyNotes: notes,
      })
    } catch (err) {
      console.error(`Failed to get ${type} notes:`, err)
      emit('dailyNoteInfo', { dailyNotes: [] })
    }
  }
}
</script>

<style lang="scss">
.memo-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 4px 8px;

  .action-group {
    display: flex;
    gap: 4px;
  }

  .filter-btn {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px 8px;
    border: none;
    background: transparent;
    border-radius: var(--b3-border-radius);
    color: var(--b3-theme-on-background);
    font-size: 12px;
    cursor: pointer;
    transition: all 0.2s;
    opacity: 0.68;

    &:hover {
      background-color: var(--b3-theme-primary-light);
      opacity: 0.5;
    }

    &.active {
      background-color: var(--b3-theme-primary);
      color: var(--b3-theme-on-primary);
      opacity: 1;

      &:hover {
        background-color: var(--b3-theme-primary);
        opacity: 0.9;
      }
    }

    .action-icon {
      height: 14px;
      width: 14px;
      fill: currentColor;
      flex-shrink: 0;
    }

    .btn-text {
      line-height: 1;
      font-weight: 500;
    }
  }
}
</style>
