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
              当前范围不包含今天
            </div>
          </template>
          <a-button
            :disabled="!containsToday"
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
          content="统计图表"
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
        <!-- 左侧：周图表区域 -->
        <div
          class="EnLifeLogWeekGraphArea"
          :class="{ 'with-statistics': showStatistics }"
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

        <!-- 右侧：统计图展示区域 -->
        <div
          v-if="showStatistics"
          class="EnLifeLogStatisticsArea"
        >
          <div class="statistics-header">
            <div class="statistics-title">
              统计图表
            </div>
            <a-button
              size="small"
              @click="toggleStatistics"
            >
              <template #icon>
                <icon-close />
              </template>
            </a-button>
          </div>
          <div class="statistics-content">
            <!-- 这里后续会添加具体的统计图表内容 -->
            <div class="statistics-placeholder">
              <div class="placeholder-text">
                统计图表展示区域
              </div>
              <div class="placeholder-subtitle">
                支持 CSV 数据、条形图、饼图等展示
              </div>
            </div>
          </div>
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
              统计图表
            </div>
            <a-button
              size="small"
              @click="toggleStatistics"
            >
              <template #icon>
                <icon-close />
              </template>
            </a-button>
          </div>
          <div class="statistics-content">
            <!-- 这里后续会添加具体的统计图表内容 -->
            <div class="statistics-placeholder">
              <div class="placeholder-text">
                统计图表展示区域
              </div>
              <div class="placeholder-subtitle">
                支持 CSV 数据、条形图、饼图等展示
              </div>
            </div>
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
import dayjs from 'dayjs'
import {
  computed,
  onBeforeUnmount,
  onMounted,
  ref,
  watch,
} from 'vue'

const {
  moduleOptions,
} = useModule<LifeLogModule>(EN_MODULE_LIST.LIFELOG)

const globalWindowData = injectGlobalWindowData()

const plugin = usePlugin()

const dateRange = ref([])
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
}

const lifeLogWeekGraphModalVisible = ref(false)
const openLifeLogWeekGraphModal = () => {
  lifeLogWeekGraphModalVisible.value = true
}

const splitedLifelogRecords = injectSplitedLifeLogRecords()
const graphRecords = computed(() => {
  return getTargetLifelogRecordsByDateList(splitedLifelogRecords.value, [...dateList.value])
})
const graphRecordsByDate = computed(() => {
  const result = {}
  dateList.value.forEach((date) => {
    // 去掉非数字，防止未来使用 / 以外的符号作为分隔符时，忘记调整这里。比如使用 - 分割年月日
    result[date] = graphRecords.value.filter((item) => item.date.replace(/\D/g, '') === date.replace(/\D/g, ''))
  })
  return result
})

const openModalByDateList = (data) => {
  const {
    dateList: dateListParams,
  } = data || {}
  let temp = []
  if (!dateListParams) {
    temp = [
      dayjs().subtract(7, 'days').format(lifelogKeyMap.YYYY_MM_DD),
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
    enEventBus.emit(EN_EVENT_BUS_KEYS.LIFELOG_LOAD_RECORDS_BY_DATE_LIST, [...dateRange.value])
  }
})

const columnWidth = ref(130)
const timelineHeight = ref(2000)

const showStatistics = ref(false)
const toggleStatistics = () => {
  showStatistics.value = !showStatistics.value
}

const openLifeLogModalCommand = {
  langKey: EN_COMMAND_KEYS.EN_LIFELOG_OPEN_GRAPH_MODAL as string,
  langText: EN_CONSTANTS.LIFELOG_OPEN_GRAPH_MODAL_DISPLAY as string,
  hotkey: "",
  callback: () => {
    openLifeLogWeekGraphModal()
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
      display: flex;
      width: 100%;
      height: 100%;
      gap: var(--en-gap);

      .EnLifeLogWeekGraphArea {
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        transition: flex 0.3s ease;
        overflow: hidden; // 防止内容溢出

        &.with-statistics {
          flex: 0.6;
        }

        // 限制 EnWeekGraph 的宽度，让它只在左侧区域内滚动
        .EnWeekGraph {
          width: 100%;
          height: 100%;
          overflow-x: auto;
          overflow-y: auto; // 允许垂直滚动
        }
      }

      .EnLifeLogStatisticsArea {
        flex: 0.4;
        display: flex;
        flex-direction: column;
        background-color: var(--b3-theme-surface);
        border: 1px solid var(--b3-border-color);
        border-radius: 6px;
        overflow: hidden;
        min-width: 300px; // 设置最小宽度，防止被挤压

        .statistics-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 4px 16px; // 减小上下内边距，匹配 30px 高度
          background-color: var(--b3-theme-surface);
          border-bottom: 1px solid var(--b3-border-color);
          height: 30px; // 与 --en-week-graph-daterow-height 保持一致
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
          align-items: center;
          background-color: var(--b3-theme-surface);
          padding: 20px;

          .statistics-placeholder {
            text-align: center;

            .placeholder-text {
              font-size: 18px;
              color: var(--b3-theme-on-surface);
              margin-bottom: 8px;
            }

            .placeholder-subtitle {
              font-size: 14px;
              color: var(--b3-theme-on-surface-variant);
            }
          }
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
          padding: 4px 16px; // 减小上下内边距，匹配 30px 高度
          background-color: var(--b3-theme-surface);
          border-bottom: 1px solid var(--b3-border-color);
          height: 30px; // 与 --en-week-graph-daterow-height 保持一致
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
          align-items: center;
          background-color: var(--b3-theme-surface);
          padding: 20px;

          .statistics-placeholder {
            text-align: center;

            .placeholder-text {
              font-size: 18px;
              color: var(--b3-theme-on-surface);
              margin-bottom: 8px;
            }

            .placeholder-subtitle {
              font-size: 14px;
              color: var(--b3-theme-on-surface-variant);
            }
          }
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
