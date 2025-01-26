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
    </div>
  </div>
</template>

<script setup lang="ts">
import { request } from '@/api'
import { useDailyNote } from '@/modules/DailyNote/DailyNote'
import {
  watch,
} from 'vue'

export type FilterType = 'daily'

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
        D.date_value
      FROM blocks C
      JOIN daily_docs D ON C.root_id = D.doc_id
      WHERE
        C.type = 'p'
        AND C.content != ''
      ORDER BY D.date_value DESC, C.updated DESC
    `,
  }
  const result = await request('/api/query/sql', data)
  console.log('SQL result:', result)
  return result
}

const toggleFilter = async (type: FilterType) => {
  if (props.modelValue === type) {
    emit('update:modelValue', undefined)
    // 清空日记信息
    emit('dailyNoteInfo', { dailyNotes: [] })
  } else {
    emit('update:modelValue', type)
    if (type === 'daily') {
      try {
        // 获取日记块
        const dailyNotes = await getDailyNotes() || []
        console.log('Daily notes from SQL:', dailyNotes)

        // 发送日记信息
        emit('dailyNoteInfo', {
          dailyNotes,
        })
      } catch (err) {
        console.error('Failed to get daily notes:', err)
        emit('dailyNoteInfo', { dailyNotes: [] })
      }
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
