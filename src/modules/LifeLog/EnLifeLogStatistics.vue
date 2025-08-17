<template>
  <div class="EnLifeLogStatistics">
    <a-table
      :data="tableData"
      :columns="tableColumns"
      :pagination="false"
      :bordered="true"
      size="small"
      summary
      class="statistics-table"
      :scroll="{
        x: 'max-content',
        y: '100%',
      }"
    >
      <template #td="{ record }">
        <td
          :data-en-lifelog-type="record.type"
          :style="{
            '--en-lifelog-color': `var(--en-lifelog-color-type-${record.type})`,
          }"
        >
          <slot />
        </td>
      </template>
      <!-- 类型列 -->
      <template #type="{ record }">
        <span
          :style="{
            paddingLeft: record.isSubType ? '20px' : '8px',
          }"
        >
          {{ record.type }}
        </span>
      </template>

      <!-- 总计列 -->
      <template #total="{ record }">
        <div
          :style="{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: '100%',
            gap: '2px',
          }"
        >
          <span
            :style="{
              fontVariantNumeric: 'tabular-nums',
              fontSize: '12px',
              fontWeight: '500',
            }"
          >
            {{ formatTimeFromSeconds(getTimeTotal(record)) }}
          </span>
          <span
            :style="{
              fontVariantNumeric: 'tabular-nums',
              fontSize: '11px',
              opacity: '0.7',
            }"
          >
            {{ getTotalCount(record) }}条 {{ getTimePercentageOfTotal(getTimeTotal(record)) }}%
          </span>
        </div>
      </template>

      <!-- 日期列 -->
      <template
        v-for="date in dateList"
        :key="date"
        #[date]="{ record }"
      >
        <div
          :style="{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: '100%',
            gap: '2px',
            cursor: 'pointer',
          }"
          @click="scrollToDate(date)"
        >
          <span
            :style="{
              fontVariantNumeric: 'tabular-nums',
              fontSize: '12px',
              fontWeight: '500',
              color: 'var(--b3-theme-on-surface-variant)',
            }"
          >
            {{ formatTimeFromSeconds(getDateTimeTotal(record, date)) }}
          </span>
          <span
            :style="{
              fontVariantNumeric: 'tabular-nums',
              fontSize: '11px',
              opacity: '0.7',
            }"
          >
            {{ record[date] || 0 }}条 {{ getTimePercentageOfTotal(getDateTimeTotal(record, date), true) }}%
          </span>
        </div>
      </template>

      <!-- 统计行 -->
      <template #summary-cell="{ column }">
        <div
          :style="{
            fontVariantNumeric: 'tabular-nums',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '100%',
            height: '100%',
            fontWeight: '600',
            color: 'var(--b3-theme-primary)',
            backgroundColor: 'var(--b3-theme-surface)',
          }"
        >
          <template v-if="column.dataIndex === 'type'">
            总计
          </template>
          <template v-else-if="column.dataIndex === 'total'">
            <div
              :style="{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '2px',
              }"
            >
              <span
                :style="{
                  fontVariantNumeric: 'tabular-nums',
                  fontSize: '11px',
                  color: 'var(--b3-theme-on-surface-variant)',
                  opacity: '0.7',
                }"
              >
                {{ getSummaryTotalCount() }}条
              </span>
              <span
                :style="{
                  fontVariantNumeric: 'tabular-nums',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: 'var(--b3-theme-primary)',
                }"
              >
                {{ formatTimeFromSeconds(getSummaryTimeTotal()) }}
              </span>
              <span
                :style="{
                  fontSize: '10px',
                  color: 'var(--b3-theme-on-surface-variant)',
                  opacity: '0.7',
                }"
              >
                总 {{ getTotalHours() }} h
              </span>
            </div>
          </template>
          <template v-else>
            <!-- 日期列 -->
            <div
              :style="{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                gap: '2px',
              }"
            >
              <span
                :style="{
                  fontSize: '11px',
                  color: 'var(--b3-theme-on-surface-variant)',
                  opacity: '0.7',
                }"
              >
                {{ getSummaryDateCount(column.dataIndex) }}条
              </span>
              <span
                :style="{
                  fontVariantNumeric: 'tabular-nums',
                  fontSize: '12px',
                  fontWeight: '500',
                  color: 'var(--b3-theme-primary)',
                }"
              >
                {{ formatTimeFromSeconds(getSummaryDateTimeTotal(column.dataIndex)) }}
              </span>
            </div>
          </template>
        </div>
      </template>
    </a-table>
  </div>
</template>

<script setup lang="ts">
import { useModule } from '@/modules/EnModuleControl/ModuleProvide'
import { EN_MODULE_LIST } from '@/utils/Constants'
import {
  computed,
} from 'vue'

interface Props {
  dateList: string[]
  graphRecordsByDate: Record<string, any[]>
}

interface Emits {
  (e: 'scrollToDate', date: string): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const {
  moduleOptions,
} = useModule<LifeLogModule>(EN_MODULE_LIST.LIFELOG)

// 获取分类显示名称
const getCategoryDisplayName = (key: string) => {
  const categoryMap = {
    fixed: '固定',
    growth: '成长',
    work: '工作',
    career: '事业',
    waste: '浪费',
    other: '其他',
  }
  return categoryMap[key] || key
}

// 格式化时间显示
const formatTimeFromSeconds = (seconds: number) => {
  const hours = Math.floor(seconds / 3600)
  const mins = Math.floor((seconds % 3600) / 60)
  const secs = seconds % 60

  const resultList = [
    {
      value: hours,
      unit: 'h',
    },
    {
      value: mins,
      unit: 'm',
    },
    {
      value: secs,
      unit: 's',
    },
  ]
  const result = resultList.filter((item) => item.value > 0).map((item) => `${item.value}${item.unit}`).join('')
  return result || '0s'
}

// 获取总计数量
const getTotalCount = (record: any) => {
  return props.dateList.reduce((sum, date) => {
    return sum + (record[date] || 0)
  }, 0)
}

// 获取时间总计
const getTimeTotal = (record: any) => {
  return props.dateList.reduce((sum, date) => {
    const recordsForDate = props.graphRecordsByDate[date] || []
    let dateTimeTotal = 0

    if (record.isCategory) {
      // 大类：计算该分类下所有子类型在每天的时间总和
      if (record.type === '其他') {
        // other分类：计算所有未定义类型的时间总和
        const definedTypes = new Set<string>()
        Object.values(moduleOptions.value.lifelogTypes).forEach((category) => {
          category.items.forEach((item) => {
            definedTypes.add(item.type)
          })
        })
        dateTimeTotal = recordsForDate
          .filter((rec) => !definedTypes.has(rec.type))
          .reduce((acc, rec) => acc + (rec.diff || 0), 0)
      } else {
        const categoryKey = Object.keys(moduleOptions.value.lifelogTypes).find((key) =>
          getCategoryDisplayName(key) === record.type,
        )
        if (categoryKey) {
          const category = moduleOptions.value.lifelogTypes[categoryKey]
          dateTimeTotal = recordsForDate
            .filter((rec) => category.items.some((item) => item.type === rec.type))
            .reduce((acc, rec) => acc + (rec.diff || 0), 0)
        }
      }
    } else {
      // 子类型：计算该类型在每天的时间总和
      const currentType = record.type
      dateTimeTotal = recordsForDate
        .filter((rec) => rec.type === currentType)
        .reduce((acc, rec) => acc + (rec.diff || 0), 0)
    }

    return sum + dateTimeTotal
  }, 0)
}

// 获取指定日期的时间总计
const getDateTimeTotal = (record: any, date: string) => {
  const recordsForDate = props.graphRecordsByDate[date] || []
  let timeTotal = 0

  if (record.isCategory) {
    // 大类：计算该分类下所有子类型在每天的时间总和
    if (record.type === '其他') {
      // other分类：计算所有未定义类型的时间总和
      const definedTypes = new Set<string>()
      Object.values(moduleOptions.value.lifelogTypes).forEach((category) => {
        category.items.forEach((item) => {
          definedTypes.add(item.type)
        })
      })
      timeTotal = recordsForDate
        .filter((rec) => !definedTypes.has(rec.type))
        .reduce((acc, rec) => acc + (rec.diff || 0), 0)
    } else {
      const categoryKey = Object.keys(moduleOptions.value.lifelogTypes).find((key) =>
        getCategoryDisplayName(key) === record.type,
      )
      if (categoryKey) {
        const category = moduleOptions.value.lifelogTypes[categoryKey]
        timeTotal = recordsForDate
          .filter((rec) => category.items.some((item) => item.type === rec.type))
          .reduce((acc, rec) => acc + (rec.diff || 0), 0)
      }
    }
  } else {
    // 子类型：计算该类型在每天的时间总和
    const currentType = record.type
    timeTotal = recordsForDate
      .filter((rec) => rec.type === currentType)
      .reduce((acc, rec) => acc + (rec.diff || 0), 0)
  }

  return timeTotal
}

// 获取总计数量（统计行）
const getSummaryTotalCount = () => {
  return tableData.value.reduce((sum, record) => {
    return sum + getTotalCount(record)
  }, 0)
}

// 获取总计时间（统计行）
const getSummaryTimeTotal = () => {
  return tableData.value.reduce((sum, record) => {
    // 只计算子类型行的时间，避免重复计算
    if (!record.isCategory) {
      return sum + getTimeTotal(record)
    }
    return sum
  }, 0)
}

// 获取指定日期的总计数量（统计行）
const getSummaryDateCount = (date: string) => {
  return tableData.value.reduce((sum, record) => {
    return sum + (record[date] || 0)
  }, 0)
}

// 获取指定日期的总计时间（统计行）
const getSummaryDateTimeTotal = (date: string) => {
  const recordsForDate = props.graphRecordsByDate[date] || []

  // 计算所有记录的时间总和
  return recordsForDate.reduce((sum, record) => {
    return sum + (record.diff || 0)
  }, 0)
}

// 生成表格列配置
const tableColumns = computed(() => {
  const columns = [
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      width: 80,
      fixed: 'left',
      slotName: 'type',
    },
    {
      title: '总计',
      dataIndex: 'total',
      key: 'total',
      width: 120,
      align: 'center',
      fixed: 'left',
      slotName: 'total',
    },
  ]

  // 添加日期列
  props.dateList.forEach((date) => {
    columns.push({
      title: date,
      dataIndex: date,
      key: date,
      width: 120,
      fixed: undefined,
      slotName: date,
    })
  })

  return columns
})

// 生成表格数据
const tableData = computed(() => {
  const result = []

  // 收集所有出现的type
  const allTypes = new Set<string>()
  props.dateList.forEach((date) => {
    const recordsForDate = props.graphRecordsByDate[date] || []
    recordsForDate.forEach((record) => {
      allTypes.add(record.type)
    })
  })

  // 按lifelogTypes的顺序生成数据
  Object.keys(moduleOptions.value.lifelogTypes).forEach((categoryKey) => {
    const category = moduleOptions.value.lifelogTypes[categoryKey]

    // 添加大类行
    const categoryRow = {
      type: getCategoryDisplayName(categoryKey),
      isCategory: true,
      isSubType: false,
    }

    // 为每个日期添加统计数据
    props.dateList.forEach((date) => {
      const recordsForDate = props.graphRecordsByDate[date] || []
      const categoryRecords = recordsForDate.filter((record) =>
        category.items.some((item) => item.type === record.type),
      )
      categoryRow[date] = categoryRecords.length
    })

    result.push(categoryRow)

    // 添加子类型行
    category.items.forEach((item) => {
      const subTypeRow = {
        type: item.type,
        isCategory: false,
        isSubType: true,
      }

      // 为每个日期添加统计数据
      props.dateList.forEach((date) => {
        const recordsForDate = props.graphRecordsByDate[date] || []
        const subTypeRecords = recordsForDate.filter((record) => record.type === item.type)
        subTypeRow[date] = subTypeRecords.length
      })

      result.push(subTypeRow)
    })
  })

  // 处理没有在lifelogTypes中定义的type，归类到other
  const definedTypes = new Set<string>()
  Object.values(moduleOptions.value.lifelogTypes).forEach((category) => {
    category.items.forEach((item) => {
      definedTypes.add(item.type)
    })
  })

  const undefinedTypes = Array.from(allTypes).filter((type) => !definedTypes.has(type))

  if (undefinedTypes.length > 0) {
    // 添加other大类行（如果还没有的话）
    const hasOtherCategory = result.some((row) => row.type === '其他' && row.isCategory)
    if (!hasOtherCategory) {
      const otherCategoryRow = {
        type: '其他',
        isCategory: true,
        isSubType: false,
      }

      // 为每个日期添加统计数据
      props.dateList.forEach((date) => {
        const recordsForDate = props.graphRecordsByDate[date] || []
        const otherRecords = recordsForDate.filter((record) => undefinedTypes.includes(record.type))
        otherCategoryRow[date] = otherRecords.length
      })

      result.push(otherCategoryRow)
    }

    // 添加未定义类型的子类型行
    undefinedTypes.forEach((type) => {
      const undefinedTypeRow = {
        type,
        isCategory: false,
        isSubType: true,
      }

      // 为每个日期添加统计数据
      props.dateList.forEach((date) => {
        const recordsForDate = props.graphRecordsByDate[date] || []
        const typeRecords = recordsForDate.filter((record) => record.type === type)
        undefinedTypeRow[date] = typeRecords.length
      })

      result.push(undefinedTypeRow)
    })
  }

  return result
})

// 计算时间百分比
const getTimePercentage = (currentTime: number, totalTime: number) => {
  if (totalTime === 0) return 0
  return Math.round((currentTime / totalTime) * 100)
}

// 计算相对于理论总时间的百分比
const getTimePercentageOfTotal = (currentTime: number, isDateColumn: boolean = false, date?: string) => {
  if (isDateColumn) {
    // 日期列：相对于一天的总秒数 (86400秒)
    return ((currentTime / 86400) * 100).toFixed(2)
  } else {
    // 总计列：相对于总天数 × 86400秒
    const totalDays = props.dateList.length
    const totalSeconds = totalDays * 86400
    return ((currentTime / totalSeconds) * 100).toFixed(2)
  }
}

// 获取总小时数
const getTotalHours = () => {
  return props.dateList.length * 24
}

// 滚动到指定日期
const scrollToDate = (date: string) => {
  emit('scrollToDate', date)
}
</script>

<style lang="scss" scoped>
.EnLifeLogStatistics {
  width: 100%;
  height: 100%;

  :deep(.statistics-table) {
    .arco-table-th {
      background-color: var(--b3-theme-surface);
      border-color: var(--b3-border-color);
      color: var(--b3-theme-on-surface);
    }

    .arco-table-td {
      border-color: var(--b3-border-color);
      color: var(--b3-theme-on-surface);
      background-color: var(--b3-theme-surface);
      // background-color: var(--lifelog-color, var(--b3-theme-surface)) !important;

      .arco-table-cell {
        background-color: color-mix(in srgb, var(--en-lifelog-color) 20%, transparent);
        width: 100%;
        height: 100%;
        min-height: 50px;
        box-sizing: border-box;
      }
    }

    // 固定列的特殊处理
    .arco-table-col-fixed-left .arco-table-cell {
      background-color: color-mix(in srgb, var(--en-lifelog-color) 20%, transparent) !important;
      width: 100% !important;
      height: 100% !important;
      box-sizing: border-box !important;
    }
  }
}
</style>
