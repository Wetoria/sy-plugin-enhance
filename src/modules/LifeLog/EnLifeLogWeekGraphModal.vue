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
          content="隐私模式"
        >
          <div class="EnPrivacyModePos">
            <a-switch
              v-model="moduleOptions.enablePrivacyMode"
              size="mini"
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
      <EnWeekGraph
        :date-list="dateList"
        :column-width="columnWidth"
        :timelineHeight="timelineHeight"
      >
        <template
          v-for="(date, index) of dateList"
          :key="`${date}-${index}`"
          #[`timelineAreaDateColumn-${date}`]
        >
          <EnLifeLogGraphDateItem :data="graphRecordsByDate[date]" />
        </template>
      </EnWeekGraph>
    </div>
  </a-modal>
</template>

<script setup lang="ts">
import {
  injectGlobalWindowData,
  useModule,
} from '@/modules/EnModuleControl/ModuleProvide'
import EnLifeLogGraphDateItem from '@/modules/LifeLog/EnLifeLogGraphDateItem.vue'
import EnWeekGraph from '@/modules/LifeLog/EnWeekGraph.vue'
import {
  getTargetLifelogRecordsByDateList,
  injectSplitedLifeLogRecords,
} from '@/modules/LifeLog/LifeLog'
import {
  EN_EVENT_BUS_KEYS,
  EN_MODULE_LIST,
} from '@/utils/Constants'
import { enEventBus } from '@/utils/EnEventBus'
import dayjs from 'dayjs'
import {
  computed,
  onMounted,
  ref,
  watch,
} from 'vue'

const {
  moduleOptions,
} = useModule<LifeLogModule>(EN_MODULE_LIST.LIFELOG)

const globalWindowData = injectGlobalWindowData()

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

onMounted(() => {
  enEventBus.on(EN_EVENT_BUS_KEYS.LIFELOG_OPEN_GRAPH_MODAL, (data) => {
    const {
      dateList,
    } = data
    const temp = [
      ...dateList,
    ]
    temp.sort((a, b) => {
      return dayjs(a).diff(dayjs(b))
    })
    dateRange.value = [
      temp[0],
      temp[temp.length - 1],
    ]
    openLifeLogWeekGraphModal()
  })
})
watch(dateRange, () => {
  if (dateRange.value[0] && dateRange.value[1]) {
    enEventBus.emit(EN_EVENT_BUS_KEYS.LIFELOG_LOAD_RECORDS_BY_DATE_LIST, [...dateRange.value])
  }
})


const columnWidth = ref(130)
const timelineHeight = ref(2000)
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
  }
}
</style>
