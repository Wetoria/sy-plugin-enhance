<template>
  <a-modal
    v-model:visible="lifeLogWeekGraphModalVisible"
    modal-class="EnLifeLogWeekGraphModal"
    title-align="start"
    :footer="false"
  >
    <template #title>
      <div class="EnLifeLogWeekGraphModalTitle">
        <div class="title">
          LifeLog
        </div>
        <a-tooltip
          content="按照当前日期间隔天数，显示前一个周期"
        >
          <a-button @click="selectPrevPeriod">
            <template #icon>
              <icon-left />
            </template>
          </a-button>
        </a-tooltip>
        <a-range-picker
          v-model="dateRange"
          style="width: 254px;"
        />
        <a-tooltip
          content="按照当前日期间隔天数，显示后一个周期"
        >
          <a-button @click="selectNextPeriod">
            <template #icon>
              <icon-right />
            </template>
          </a-button>
        </a-tooltip>
        <a-tooltip>
          <template #content>
            <div>
              居中显示今天
            </div>
            <div v-if="!containsToday">
              当前范围不包含今天，将会加载并跳转
            </div>
          </template>
          <a-button
            @click="goToToday"
          >
            今天
          </a-button>
        </a-tooltip>
        <a-tooltip
          content="调整每一个日期列的宽度"
        >
          <a-input-number
            v-model="columnWidth"
            placeholder="Please Enter"
            style="width: 100px;"
            mode="button"
            :step="10"
            :min="100"
          />
        </a-tooltip>
        <a-tooltip
          content="缩放时间轴区域"
        >
          <a-input-number
            v-model="timelineHeight"
            placeholder="Please Enter"
            style="width: 110px;"
            mode="button"
            :step="200"
            :min="100"
          />
        </a-tooltip>
        <a-tooltip
          content="展示当前时间范围内的统计结果"
        >
          <a-button
            :type="showStatistics ? 'primary' : 'outline'"
            @click="toggleStatistics"
          >
            <template #icon>
              <icon-bar-chart />
            </template>
            统计
          </a-button>
        </a-tooltip>
        <a-tooltip
          content="隐私模式"
        >
          <div class="EnPrivacyModePos">
            <a-switch
              v-model="moduleOptions.enablePrivacyMode"
              size="small"
            />
          </div>
        </a-tooltip>
        <a-spin v-if="globalWindowData.loadingLifeLogData" />
      </div>
    </template>
    <div
      ref="EnLifeLogWeekGraphModalContainerRef"
      class="EnLifeLogWeekGraphModalContainer"
    >
      <!-- 桌面端：左右布局 -->
      <div
        v-if="!plugin.isMobile"
        class="EnLifeLogDesktopLayout"
      >
        <a-split
          v-if="showStatistics"
          class="split-container"
          :min="0.3"
          :max="0.7"
        >
          <template #first>
            <!-- 左侧：周图表区域 -->
            <div class="EnLifeLogWeekGraphArea">
              <EnWeekGraph
                :date-list="dateList"
                :column-width="columnWidth"
                :timelineHeight="timelineHeight"
              >
                <template
                  v-for="(date) of dateList"
                  :key="`${date}`"
                  #[`timelineAreaDateColumn-${date}`]
                >
                  <EnLifeLogGraphDateItem :data="graphRecordsByDate[date]" />
                </template>
              </EnWeekGraph>
            </div>
          </template>

          <template #second>
            <!-- 右侧：统计图展示区域 -->
            <div class="EnLifeLogStatisticsArea">
              <div class="statistics-header">
                <div class="statistics-title">
                  统计
                </div>
                <a-button
                  type="text"
                  shape="circle"
                  size="mini"
                  @click="toggleStatistics"
                >
                  <template #icon>
                    <icon-close />
                  </template>
                </a-button>
              </div>
              <div class="statistics-content">
                <EnLifeLogStatistics
                  :date-list="dateList"
                  :graph-records-by-date="graphRecordsByDate"
                  @scroll-to-date="scrollToDate"
                />
              </div>
            </div>
          </template>

        </a-split>

        <!-- 不显示统计时的布局 -->
        <div
          v-else
          class="EnLifeLogWeekGraphArea"
        >
          <EnWeekGraph
            :date-list="dateList"
            :column-width="columnWidth"
            :timelineHeight="timelineHeight"
          >
            <template
              v-for="(date) of dateList"
              :key="`${date}`"
              #[`timelineAreaDateColumn-${date}`]
            >
              <EnLifeLogGraphDateItem :data="graphRecordsByDate[date]" />
            </template>
          </EnWeekGraph>
        </div>
      </div>

      <!-- 移动端：占满布局 -->
      <div
        v-else
        class="EnLifeLogMobileLayout"
      >
        <!-- 统计图展示区域 -->
        <div
          v-if="showStatistics"
          class="EnLifeLogStatisticsArea"
        >
          <div class="statistics-header">
            <div class="statistics-title">
              统计
            </div>
            <a-button
              type="text"
              shape="circle"
              size="mini"
              @click="toggleStatistics"
            >
              <template #icon>
                <icon-close />
              </template>
            </a-button>
          </div>
          <div class="statistics-content">
            <EnLifeLogStatistics
              :date-list="dateList"
              :graph-records-by-date="graphRecordsByDate"
              @scroll-to-date="scrollToDate"
            />
          </div>
        </div>

        <!-- 周图表区域 -->
        <div
          v-else
          class="EnLifeLogWeekGraphArea"
        >
          <EnWeekGraph
            :date-list="dateList"
            :column-width="columnWidth"
            :timelineHeight="timelineHeight"
          >
            <template
              v-for="(date) in dateList"
              :key="`${date}`"
              #[`timelineAreaDateColumn-${date}`]
            >
              <EnLifeLogGraphDateItem :data="graphRecordsByDate[date]" />
            </template>
          </EnWeekGraph>
        </div>
      </div>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import { usePlugin } from '@/main'
import {
  injectGlobalWindowData,
  useModule,
} from '@/modules/EnModuleControl/ModuleProvide'
import EnLifeLogGraphDateItem from '@/modules/LifeLog/EnLifeLogGraphDateItem.vue'
import EnLifeLogStatistics from '@/modules/LifeLog/EnLifeLogStatistics.vue'
import EnWeekGraph from '@/modules/LifeLog/EnWeekGraph.vue'
import {
  getTargetLifelogRecordsByDateList,
  injectSplitedLifeLogRecords,
  lifelogKeyMap,
} from '@/modules/LifeLog/LifeLog'
import {
  addCommand,
  removeCommand,
} from '@/utils/Commands'
import {
  EN_COMMAND_KEYS,
  EN_CONSTANTS,
  EN_EVENT_BUS_KEYS,
  EN_MODULE_LIST,
} from '@/utils/Constants'
import { enEventBus } from '@/utils/EnEventBus'
import { useLocalStorage } from '@vueuse/core'
import dayjs from 'dayjs'
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
  watchEffect,
} from 'vue'

const {
  moduleOptions,
} = useModule<LifeLogModule>(EN_MODULE_LIST.LIFELOG)

const globalWindowData = injectGlobalWindowData()

const plugin = usePlugin()

const dateRange = ref([])

const disableWatchUpdateDateRange = ref(false)
const updateDateRange = (dateList: string[], isImmediately = false) => {
  if (isImmediately) {
    disableWatchUpdateDateRange.value = true
    enEventBus.emit(EN_EVENT_BUS_KEYS.LIFELOG_LOAD_RECORDS_BY_DATE_LIST_IMMEDIATELY, dateList)
  }
  dateRange.value = [
    dateList[0],
    dateList[dateList.length - 1],
  ]
}

const dateList = computed(() => {
  const dates = []
  const startDate = dayjs(dateRange.value[0])
  const endDate = dayjs(dateRange.value[1])
  let currentDate = startDate
  while (currentDate.isBefore(endDate) || currentDate.isSame(endDate)) {
    dates.push(currentDate.format('YYYY-MM-DD'))
    currentDate = currentDate.add(1, 'day')
  }
  return dates
})
const containsToday = computed(() => {
  return dateList.value.includes(dayjs().format('YYYY-MM-DD'))
})

const period = computed(() => {
  return dayjs(dateRange.value[1]).diff(dayjs(dateRange.value[0]), 'day')
})

const selectPrevPeriod = () => {
  const startDate = dayjs(dateRange.value[0])
  dateRange.value = [
    startDate.subtract(period.value + 1, 'day').format('YYYY-MM-DD'),
    startDate.subtract(1, 'day').format('YYYY-MM-DD'),
  ]
}
const selectNextPeriod = () => {
  const endDate = dayjs(dateRange.value[1])
  dateRange.value = [
    endDate.add(1, 'day').format('YYYY-MM-DD'),
    endDate.add(period.value + 1, 'day').format('YYYY-MM-DD'),
  ]
}

const EnLifeLogWeekGraphModalContainerRef = ref()
const goToToday = () => {
  if (containsToday.value) {
    // 如果包含今天，滚动到今天的位置
    const todayCell = EnLifeLogWeekGraphModalContainerRef.value.querySelector('.DateRow .DateColumn .Cell .Today')
    if (!todayCell) {
      return
    }
    const enWeekGraphEl = todayCell.closest('.EnWeekGraph')
    const dateColumnEl = todayCell.closest('.DateColumn')
    const enWeekGraphRect = enWeekGraphEl.getBoundingClientRect()
    const dateColumnRect = dateColumnEl.getBoundingClientRect()
    enWeekGraphEl.scrollTo({
      left: dateColumnEl.offsetLeft - (enWeekGraphRect.width / 2) + (dateColumnRect.width / 2),
      behavior: 'smooth',
    })
  } else {
    // 如果不包含今天，加载今天开始的最新七天数据
    const today = dayjs().format(lifelogKeyMap.YYYY_MM_DD)
    const sevenDaysAgo = dayjs().subtract(6, 'day').format(lifelogKeyMap.YYYY_MM_DD)
    updateDateRange([sevenDaysAgo, today], true)

    // 监听一次数据变动，在数据加载完成后跳转至今日
    const unwatch = watch(graphRecords, () => {
      // 数据加载完成后，跳转至今日
      nextTick(() => {
        const todayCell = EnLifeLogWeekGraphModalContainerRef.value.querySelector('.DateRow .DateColumn .Cell .Today')
        if (todayCell) {
          const enWeekGraphEl = todayCell.closest('.EnWeekGraph')
          const dateColumnEl = todayCell.closest('.DateColumn')
          const enWeekGraphRect = enWeekGraphEl.getBoundingClientRect()
          const dateColumnRect = dateColumnEl.getBoundingClientRect()
          enWeekGraphEl.scrollTo({
            left: dateColumnEl.offsetLeft - (enWeekGraphRect.width / 2) + (dateColumnRect.width / 2),
            behavior: 'smooth',
          })
        }
      })
      // 只监听一次，完成后取消监听
      unwatch()
    }, { once: true })
  }
}

const lifeLogWeekGraphModalVisible = ref(false)
const openLifeLogWeekGraphModal = () => {
  lifeLogWeekGraphModalVisible.value = true
}
const closeLifeLogWeekGraphModal = () => {
  lifeLogWeekGraphModalVisible.value = false
}

const splitedLifelogRecords = injectSplitedLifeLogRecords()
const graphRecords = computed(() => {
  return getTargetLifelogRecordsByDateList(splitedLifelogRecords.value, [...dateList.value])
})

watchEffect(() => {
  console.log('graphRecords is ', graphRecords.value)
})
const graphRecordsByDate = computed(() => {
  const result = {}
  dateList.value.forEach((date) => {
    // 去掉非数字，防止未来使用 / 以外的符号作为分隔符时，忘记调整这里。比如使用 - 分割年月日
    result[date] = graphRecords.value.filter((item) => item.date.replace(/\D/g, '') === date.replace(/\D/g, ''))
  })
  return result
})

const openModalByDateList = (data?: { dateList: string[] }) => {
  const {
    dateList: dateListParams,
  } = data || {}
  let temp = []
  if (!dateListParams) {
    temp = [
      dayjs().subtract(6, 'days').format(lifelogKeyMap.YYYY_MM_DD),
      dayjs().format(lifelogKeyMap.YYYY_MM_DD),
    ]
  } else {
    if (dateListParams.length === 1) {
      temp = [
        ...dateListParams,
        dayjs(dateListParams[0]).subtract(7, 'day').format(lifelogKeyMap.YYYY_MM_DD),
      ]
    } else {
      temp = [
        ...dateListParams,
      ]
    }
  }
  temp.sort((a, b) => {
    return dayjs(a).diff(dayjs(b))
  })
  dateRange.value = [
    temp[0],
    temp[temp.length - 1],
  ]
  openLifeLogWeekGraphModal()
}

onMounted(() => {
  enEventBus.on(EN_EVENT_BUS_KEYS.LIFELOG_OPEN_GRAPH_MODAL, openModalByDateList)
})
watch(dateRange, () => {
  if (dateRange.value[0] && dateRange.value[1]) {
    if (disableWatchUpdateDateRange.value) {
      disableWatchUpdateDateRange.value = false
    } else {
      enEventBus.emit(EN_EVENT_BUS_KEYS.LIFELOG_LOAD_RECORDS_BY_DATE_LIST, [...dateRange.value])
    }
  }
})

const columnWidth = useLocalStorage('en-lifelog-column-width', 130)
const timelineHeight = useLocalStorage('en-lifelog-timeline-height', 2000)
const showStatistics = useLocalStorage('en-lifelog-show-statistics', false)

const toggleStatistics = () => {
  showStatistics.value = !showStatistics.value
}

const scrollToDate = (date: string) => {
  const targetCell = EnLifeLogWeekGraphModalContainerRef.value.querySelector(`.DateRow .DateColumn[data-date="${date}"] .Cell`)
  if (!targetCell) {
    return
  }
  const enWeekGraphEl = targetCell.closest('.EnWeekGraph')
  const dateColumnEl = targetCell.closest('.DateColumn')
  const enWeekGraphRect = enWeekGraphEl.getBoundingClientRect()
  const dateColumnRect = dateColumnEl.getBoundingClientRect()
  enWeekGraphEl.scrollTo({
    left: dateColumnEl.offsetLeft - (enWeekGraphRect.width / 2) + (dateColumnRect.width / 2),
    behavior: 'smooth',
  })
}

const openLifeLogModalCommand = {
  langKey: EN_COMMAND_KEYS.EN_LIFELOG_OPEN_GRAPH_MODAL as string,
  langText: EN_CONSTANTS.LIFELOG_OPEN_GRAPH_MODAL_DISPLAY as string,
  hotkey: "",
  callback: () => {
    if (lifeLogWeekGraphModalVisible.value) {
      closeLifeLogWeekGraphModal()
    } else {
      openModalByDateList()
    }
  },
}
onMounted(() => {
  addCommand(openLifeLogModalCommand)
})
onBeforeUnmount(() => {
  removeCommand(openLifeLogModalCommand)
})
</script>

<style lang="scss" scoped>

</style>

<style lang="scss">
.EnLifeLogWeekGraphModal {
  width: 90vw;
  height: 85vh;

  .arco-modal-header {
    max-width: 100%;
    overflow: hidden;
  }
  .arco-modal-title {
    max-width: 100%;
    margin-right: 14px;
    overflow-x: auto;

    &::-webkit-scrollbar {
      display: none;
    }
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .EnLifeLogWeekGraphModalTitle {
    display: flex;
    justify-content: start;
    align-items: center;
    gap: var(--en-gap);
    box-sizing: border-box;

    // * {
    //   flex-shrink: 0;
    // }
  }

  .arco-modal-body {
    height: calc(100% - 48px);
    box-sizing: border-box;
    padding: var(--en-gap);

    .EnLifeLogWeekGraphModalContainer {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .EnPrivacyModePos {
      width: 100%;
      height: 100%;
      display: flex;
      box-sizing: border-box;
      justify-content: center;
      align-items: center;
      padding: 4px;
    }

    // 桌面端布局
    .EnLifeLogDesktopLayout {
      width: 100%;
      height: 100%;
      gap: var(--en-gap);

      .split-container {
        width: 100%;
        height: 100%;
      }

      .EnLifeLogWeekGraphArea {
        width: 100%;
        height: 100%;
        display: flex;
        justify-content: center;
        align-items: center;
        overflow: hidden; // 防止内容溢出

        // 限制 EnWeekGraph 的宽度，让它只在左侧区域内滚动
        .EnWeekGraph {
          width: 100%;
          height: 100%;
          overflow-x: auto;
          overflow-y: auto; // 允许垂直滚动
        }
      }

      .EnLifeLogStatisticsArea {
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        background-color: var(--b3-theme-surface);
        border: 1px solid var(--b3-border-color);
        border-radius: 6px;
        overflow: hidden;

        .statistics-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 4px 16px;
          background-color: var(--b3-theme-surface);
          border-bottom: 1px solid var(--b3-border-color);
          height: 40px; // 增加高度以适配两行日期显示
          box-sizing: border-box;
          flex-shrink: 0; // 防止头部被压缩

          .statistics-title {
            font-size: 14px;
            font-weight: 600;
            color: var(--b3-theme-on-surface);
          }
        }

        .statistics-content {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          background-color: var(--b3-theme-surface);
          padding: 20px;
          overflow: auto;
          min-height: 0; // 确保 flex 子元素可以正确收缩
        }
      }
    }

    // 移动端布局
    .EnLifeLogMobileLayout {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;

      .EnLifeLogWeekGraphArea {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .EnLifeLogStatisticsArea {
        flex: 1;
        display: flex;
        flex-direction: column;
        background-color: var(--b3-theme-surface);
        border: 1px solid var(--b3-border-color);
        border-radius: 6px;
        overflow: hidden;

        .statistics-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 4px 16px; // 减小上下内边距，匹配 40px 高度
          background-color: var(--b3-theme-surface);
          border-bottom: 1px solid var(--b3-border-color);
          height: 40px; // 与桌面端保持一致，适配两行日期显示
          box-sizing: border-box;

          .statistics-title {
            font-size: 14px; // 稍微减小字体大小
            font-weight: 600;
            color: var(--b3-theme-on-surface);
          }
        }

        .statistics-content {
          flex: 1;
          display: flex;
          justify-content: center;
          align-items: flex-start; // 改为顶部对齐
          background-color: var(--b3-theme-surface);
          padding: 20px;
          overflow: auto; // 允许滚动
        }
      }
    }
  }
}

// 响应式布局
@media (max-width: 768px) {
  .EnLifeLogWeekGraphModal {
    width: 95vw;
    height: 90vh;
  }
}
</style>
