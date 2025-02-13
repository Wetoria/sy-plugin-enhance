<template>
  <div
    class="memo-calendar"
  >
    <div class="calendar-header">
      <div class="year-month-selector">
        <span
          class="nav-btn"
          @click="prevYear"
        >
          <IconDoubleLeft />
        </span>
        <span
          class="nav-btn"
          @click="prevMonth"
        >
          <IconLeft />
        </span>
        <a-dropdown trigger="click">
          <span class="current-date">{{ currentYearMonth }}</span>
          <template #content>
            <div class="year-month-picker">
              <div class="year-picker">
                <div class="year-input">
                  <a-input-number
                    v-model="currentYear"
                    :min="1900"
                    :max="2100"
                    size="mini"
                    hide-button
                  />
                  <span class="year-label">年</span>
                </div>
              </div>
              <div class="month-grid">
                <div
                  v-for="month in 12"
                  :key="month"
                  class="month-item"
                  :class="{ active: isCurrentMonth(month) }"
                  @click="selectMonth(month)"
                >
                  {{ month }}月
                </div>
              </div>
            </div>
          </template>
        </a-dropdown>
        <span
          class="nav-btn"
          @click="nextMonth"
        >
          <IconRight />
        </span>
        <span
          class="nav-btn"
          @click="nextYear"
        >
          <IconDoubleRight />
        </span>
      </div>
    </div>
    <div class="calendar-body">
      <div class="calendar-weekdays">
        <div
          v-for="weekday in weekdays"
          :key="weekday"
          class="weekday"
        >
          {{ weekday }}
        </div>
      </div>
      <div
        class="calendar-days"
        @mousedown="startDragSelect"
        @mousemove="handleDragSelect"
        @mouseup="endDragSelect"
        @mouseleave="endDragSelect"
      >
        <div
          v-for="day in calendarDays"
          :key="day.date"
          class="day"
          :class="{
            'other-month': !day.isCurrentMonth,
            'today': day.isToday,
            'has-memos': day.hasMemos,
            'selected': isSelected(day.date),
            'in-range': isInDragRange(day.date),
          }"
          :data-date="day.date"
          @click="handleDateClick($event, day.date)"
        >
          {{ day.dayOfMonth }}
          <div
            v-if="day.hasMemos"
            class="memo-indicator"
          ></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Memo } from './MemoTimeline.vue'
import {
  IconDoubleLeft,
  IconDoubleRight,
  IconLeft,
  IconRight,
} from '@arco-design/web-vue/es/icon'
import dayjs from 'dayjs'
import isBetween from 'dayjs/plugin/isBetween'
import isSameOrBefore from 'dayjs/plugin/isSameOrBefore'
import {
  computed,
  ref,
  watch,
} from 'vue'

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:modelValue', value: string[]): void
  (e: 'dateSelect', dates: string[]): void
}>()
dayjs.extend(isBetween)
dayjs.extend(isSameOrBefore)

interface CalendarDay {
  date: string // YYYY-MM-DD
  dayOfMonth: number
  isCurrentMonth: boolean
  isToday: boolean
  hasMemos: boolean
}

interface Props {
  memos: Memo[]
  modelValue?: string[]
}

const currentDate = ref(dayjs())
const selectedDates = ref<string[]>(props.modelValue || [])
const isDragging = ref(false)
const dragStartDate = ref<string | null>(null)
const dragEndDate = ref<string | null>(null)

// 星期几的标签
const weekdays = ['日', '一', '二', '三', '四', '五', '六']

// 当前年月显示
const currentYearMonth = computed(() => {
  return currentDate.value.format('YYYY年MM月')
})

const currentYear = computed({
  get: () => currentDate.value.year(),
  set: (value) => {
    currentDate.value = currentDate.value.year(value)
  },
})

// 检查是否是当前选中的月份
const isCurrentMonth = (month: number) => {
  return currentDate.value.month() + 1 === month
}

// 计算日历天数
const calendarDays = computed(() => {
  const current = currentDate.value
  const firstDay = current.startOf('month')
  const lastDay = current.endOf('month')

  // 获取当前月的第一天是星期几
  const firstDayOfWeek = firstDay.day()

  // 获取上个月需要显示的天数
  const daysFromPrevMonth = firstDayOfWeek

  // 获取当前月的总天数
  const daysInMonth = lastDay.date()

  // 计算下个月需要显示的天数
  const totalDays = 42 // 6行7列
  const daysFromNextMonth = totalDays - daysInMonth - daysFromPrevMonth

  const days: CalendarDay[] = []

  // 添加上个月的日期
  const prevMonth = current.subtract(1, 'month')
  const prevMonthLastDay = prevMonth.endOf('month').date()
  for (let i = daysFromPrevMonth - 1; i >= 0; i--) {
    const date = prevMonth.date(prevMonthLastDay - i)
    days.push({
      date: date.format('YYYY-MM-DD'),
      dayOfMonth: prevMonthLastDay - i,
      isCurrentMonth: false,
      isToday: date.isSame(dayjs(), 'day'),
      hasMemos: hasMemoOnDate(date),
    })
  }

  // 添加当前月的日期
  for (let i = 1; i <= daysInMonth; i++) {
    const date = current.date(i)
    days.push({
      date: date.format('YYYY-MM-DD'),
      dayOfMonth: i,
      isCurrentMonth: true,
      isToday: date.isSame(dayjs(), 'day'),
      hasMemos: hasMemoOnDate(date),
    })
  }

  // 添加下个月的日期
  const nextMonth = current.add(1, 'month')
  for (let i = 1; i <= daysFromNextMonth; i++) {
    const date = nextMonth.date(i)
    days.push({
      date: date.format('YYYY-MM-DD'),
      dayOfMonth: i,
      isCurrentMonth: false,
      isToday: date.isSame(dayjs(), 'day'),
      hasMemos: hasMemoOnDate(date),
    })
  }

  return days
})

// 检查指定日期是否有备忘录
const hasMemoOnDate = (date: dayjs.Dayjs) => {
  return props.memos.some((memo) => {
    const memoDate = dayjs(memo.time)
    return memoDate.isSame(date, 'day')
  })
}

// 检查日期是否被选中
const isSelected = (date: string) => {
  return selectedDates.value.includes(date)
}

// 检查日期是否在拖拽范围内
const isInDragRange = (date: string) => {
  if (!isDragging.value || !dragStartDate.value || !dragEndDate.value) return false
  const start = dayjs(dragStartDate.value)
  const end = dayjs(dragEndDate.value)
  const current = dayjs(date)
  // 支持双向范围
  const rangeStart = start.isBefore(end) ? start : end
  const rangeEnd = start.isBefore(end) ? end : start
  return current.isBetween(rangeStart, rangeEnd, 'day', '[]')
}

// 处理日期点击
const handleDateClick = (event: MouseEvent, date: string) => {
  if (isDragging.value) return // 如果正在划选，忽略点击事件

  if (event.shiftKey) {
    // Shift + 点击：添加或移除单个日期
    const index = selectedDates.value.indexOf(date)
    if (index === -1) {
      selectedDates.value = [...selectedDates.value, date].sort()
    } else {
      selectedDates.value = selectedDates.value.filter((d) => d !== date)
    }
  } else {
    // 普通点击：替换所有选中日期
    selectedDates.value = [date]
  }
  emit('update:modelValue', selectedDates.value)
  emit('dateSelect', selectedDates.value)
}

// 开始拖拽选择
const startDragSelect = (event: MouseEvent) => {
  const target = event.target as HTMLElement
  const date = target.closest('.day')?.getAttribute('data-date')
  if (!date) return

  isDragging.value = true
  dragStartDate.value = date
  dragEndDate.value = date

  // 如果没有按住 shift 键，清空之前的选择
  if (!event.shiftKey) {
    selectedDates.value = []
  }
}

// 处理拖拽选择
const handleDragSelect = (event: MouseEvent) => {
  if (!isDragging.value || !dragStartDate.value) return

  const target = event.target as HTMLElement
  const date = target.closest('.day')?.getAttribute('data-date')
  if (!date) return

  dragEndDate.value = date

  // 实时更新选择范围
  const start = dayjs(dragStartDate.value)
  const end = dayjs(dragEndDate.value)
  const dates: string[] = []

  // 支持双向范围
  const rangeStart = start.isBefore(end) ? start : end
  const rangeEnd = start.isBefore(end) ? end : start

  let current = rangeStart
  while (current.isSameOrBefore(rangeEnd, 'day')) {
    dates.push(current.format('YYYY-MM-DD'))
    current = current.add(1, 'day')
  }

  // 根据 shift 键状态决定是否合并选择
  if (event.shiftKey) {
    // 保留原有选择，添加新的范围
    const existingDates = selectedDates.value.filter((d) => !dates.includes(d))
    selectedDates.value = [...existingDates, ...dates].sort()
  } else {
    // 替换为新的范围
    selectedDates.value = dates.sort()
  }

  emit('update:modelValue', selectedDates.value)
  emit('dateSelect', selectedDates.value)
}

// 结束拖拽选择
const endDragSelect = () => {
  isDragging.value = false
  dragStartDate.value = null
  dragEndDate.value = null
}

// 上个月
const prevMonth = () => {
  currentDate.value = currentDate.value.subtract(1, 'month')
}

// 下个月
const nextMonth = () => {
  currentDate.value = currentDate.value.add(1, 'month')
}

// 上一年
const prevYear = () => {
  currentDate.value = currentDate.value.subtract(1, 'year')
}

// 下一年
const nextYear = () => {
  currentDate.value = currentDate.value.add(1, 'year')
}

// 选择月份
const selectMonth = (month: number) => {
  currentDate.value = currentDate.value.month(month - 1)
}

// 监听 modelValue 变化
watch(() => props.modelValue, (newValue) => {
  if (newValue) {
    selectedDates.value = newValue
  }
})
</script>

<style lang="scss" scoped>
.memo-calendar {
  border-radius: var(--b3-border-radius);
  padding: 0px;

  .calendar-header {
    display: flex;
    justify-content: center;
    margin-bottom: 8px;

    .year-month-selector {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 4px;
      border-radius: var(--b3-border-radius);
      background: var(--b3-theme-surface);

      .nav-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 24px;
        height: 24px;
        cursor: pointer;
        border-radius: var(--b3-border-radius);
        color: var(--b3-theme-on-surface);
        opacity: 0.68;

        &:hover {
          background: var(--b3-theme-background-light);
          opacity: 1;
        }

        svg {
          width: 14px;
          height: 14px;
        }
      }

      .current-date {
        padding: 0 8px;
        font-size: 14px;
        cursor: pointer;
        border-radius: var(--b3-border-radius);

        &:hover {
          background: var(--b3-theme-background-light);
        }
      }
    }
  }

  .year-month-picker {
    padding: 16px;
    min-width: 240px;

    .year-picker {
      margin-bottom: 16px;

      .year-input {
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;

        :deep(.arco-input-number) {
          width: 80px;
        }

        .year-label {
          font-size: 14px;
        }
      }
    }

    .month-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;

      .month-item {
        padding: 6px;
        text-align: center;
        cursor: pointer;
        border-radius: var(--b3-border-radius);
        transition: all 0.2s;

        &:hover {
          background: var(--b3-theme-background-light);
        }

        &.active {
          background: var(--b3-theme-primary);
          color: var(--b3-theme-on-primary);
        }
      }
    }
  }

  .calendar-body {
    .calendar-weekdays {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      text-align: center;
      margin-bottom: 4px;

      .weekday {
        padding: 4px;
        font-size: 12px;
        color: var(--b3-theme-on-surface);
        opacity: 0.68;
      }
    }

    .calendar-days {
      display: grid;
      grid-template-columns: repeat(7, 1fr);
      gap: 2px;
      user-select: none;

      .day {
        position: relative;
        padding: 4px;
        text-align: center;
        cursor: pointer;
        border-radius: var(--b3-border-radius);
        font-size: 12px;
        transition: all 0.2s;

        &:hover {
          background-color: var(--b3-theme-background-light);
        }

        &.today {
          border: 1px solid var(--b3-theme-primary);
          color: var(--b3-theme-on-background);
          font-weight: bold;

          &.in-range {
            border-color: transparent;
          }

          &.selected {
            border-color: transparent;
            color: var(--b3-theme-on-primary);
          }
        }

        &.in-range {
          background-color: var(--b3-theme-primary-light);
          opacity: 0.5;

          &.other-month {
            opacity: 0.2;
          }

          .memo-indicator {
            background-color: var(--b3-theme-primary);
          }
        }

        &.selected {
          background-color: var(--b3-theme-primary);
          color: var(--b3-theme-on-primary);

          &:hover {
            background-color: var(--b3-theme-primary);
            opacity: 0.9;
          }

          &.other-month {
            opacity: 0.5;
          }

          .memo-indicator {
            background-color: var(--b3-theme-on-primary);
          }
        }

        &.other-month {
          color: var(--b3-theme-on-surface);
          opacity: 0.38;
        }

        &.has-memos {
          font-weight: bold;

          .memo-indicator {
            position: absolute;
            bottom: 2px;
            left: 50%;
            transform: translateX(-50%);
            width: 4px;
            height: 4px;
            border-radius: 50%;
            background-color: var(--b3-theme-primary);
          }
        }
      }
    }
  }
}
</style>
