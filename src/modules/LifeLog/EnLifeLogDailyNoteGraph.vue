<template>
  <Teleport
    :to="enProtyleItem.protyleContentEl?.parentNode"
  >
    <div
      ref="EnLifeLogDailyNoteGraphRef"
      class="EnLifeLogDailyNoteGraph"
      @click="openLifeLogGraphModal"
    >
      <EnLifeLogSideGraph
        :dateList="dayValueList"
      >
        <template #placeholder>
          <a-tooltip
            content="隐私模式"
          >
            <div class="EnPrivacyModePos">
              <a-switch
                v-model="moduleOptions.enablePrivacyMode"
              />
            </div>
          </a-tooltip>
        </template>
        <template
          v-for="(date, index) of dayValueList"
          :key="`${date}-${index}`"
          #[date]="{ secondsOfADay }"
        >
          <div
            v-for="record of graphRecordsByDate[date]"
            :key="record.block_id"
            class="EnLifeLogGraphItem"
            :data-en_lifelog_date="date"
            :data-en_lifelog_type="record.type"
            :data-en_lifelog_content="record.content"
            :data-en_lifelog_diff="record.diff"
            :data-en_lifelog_diff_format="record.diffFormatted"
            :style="{
              height: `${(record.diff / secondsOfADay) * 100}%`,
            }"
          >
            <div
              class="EnLifeLogItemBg"
              :style="{
                backgroundColor: `var(--en-lifelog-color-type-${record.type})`,
              }"
            >

            </div>
            <div class="infos">
              <div class="info">
                {{
                  [
                    record.type,
                    moduleOptions.enablePrivacyMode ? '' : record.content,
                  ].filter(Boolean).join('：')
                }}
              </div>
              <div
                class="info"
              >
                持续：{{ record.totalDiffFormatted }}
              </div>
              <div
                v-if="(record.diff / secondsOfADay) > 0.01"
                class="time info"
              >
                {{ record.endTime.format(lifelogKeyMap.HH_mm_ss) }}
              </div>
            </div>
          </div>
        </template>
      </EnLifeLogSideGraph>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { useModule } from '@/modules/EnModuleControl/ModuleProvide'
import EnLifeLogSideGraph from '@/modules/LifeLog/EnLifeLogSideGraph.vue'
import {
  getTargetLifelogRecordsByDateList,
  injectSplitedLifeLogRecords,
} from '@/modules/LifeLog/LifeLog'
import {
  EN_EVENT_BUS_KEYS,
  EN_MODULE_LIST,
} from '@/utils/Constants'
import { queryAllByDom } from '@/utils/DOM'
import { enEventBus } from '@/utils/EnEventBus'
import {
  computed,
  nextTick,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  ref,
  watch,
} from 'vue'
import { lifelogKeyMap } from './LifeLog'


const props = defineProps<{
  enProtyleItem: IProtyleObserverItem
}>()

const {
  moduleOptions,
} = useModule<LifeLogModule>(EN_MODULE_LIST.LIFELOG)

const dayList = computed(() => {
  return props.enProtyleItem.dailyNoteValues
})
const dayValueList = computed(() => {
  const temp = Object.values(dayList.value).map((item) => `${item}`)
  temp.sort((a, b) => b.localeCompare(a))
  return temp
})

const splitedLifelogRecords = injectSplitedLifeLogRecords()

const graphRecords = computed(() => {
  return getTargetLifelogRecordsByDateList(splitedLifelogRecords.value, [...dayValueList.value])
})

const graphRecordsByDate = computed(() => {
  const result = {}
  dayValueList.value.forEach((date) => {
    // 去掉非数字，防止未来使用 / 以外的符号作为分隔符时，忘记调整这里。比如使用 - 分割年月日
    result[date] = graphRecords.value.filter((item) => item.date.replace(/\D/g, '') === date)
  })
  return result
})

onMounted(() => {
  enEventBus.emit(EN_EVENT_BUS_KEYS.LIFELOG_LOAD_RECORDS_BY_DATE_LIST, [...dayValueList.value])
})


const EnLifeLogDailyNoteGraphRef = ref()
function checkHeight() {
  const itemList = queryAllByDom(EnLifeLogDailyNoteGraphRef.value, '.EnLifeLogGraphItem')

  itemList.forEach((item: HTMLDivElement) => {
    const infosEl = item.querySelector('.infos')
    if (item.clientHeight > infosEl?.clientHeight + 8) {
      item.dataset.en_lifelog_show_info = 'true'
    } else {
      item.dataset.en_lifelog_show_info = 'false'
    }
  })
}

onMounted(() => {
  checkHeight()
  window.addEventListener('resize', checkHeight)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', checkHeight)
})
onUpdated(() => {
  checkHeight()
})
watch(graphRecordsByDate, () => {
  nextTick(() => {
    checkHeight()
  })
})

const openLifeLogGraphModal = () => {
  console.log('openLifeLogGraphModal')
  enEventBus.emit(EN_EVENT_BUS_KEYS.LIFELOG_OPEN_GRAPH_MODAL, {
    dateList: dayValueList.value,
  })
}
</script>

<style lang="scss" scoped>
.EnLifeLogDailyNoteGraph {
  position: absolute;
  left: 0;
  top: 30px;
  width: 5px;
  max-width: 90%;
  height: calc(100% - 30px);
  background-color: var(--b3-theme-surface);
  display: flex;
  z-index: 9;
  overflow: hidden;
  cursor: pointer;

  --en-lifelog-graph-font-size: 8px;

  .EnPrivacyModePos {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    box-sizing: border-box;
  }

  .EnLifeLogSideGraph {
    height: calc(100% + var(--en-lifelog-graph-date-title-area-height));
    transform: translate(
      calc(var(--en-lifelog-graph-prompt-area-width) * -1),
      calc(var(--en-lifelog-graph-date-title-area-height) * -1),
    );
  }

  &:hover {
    width: auto;
    background-color: var(--b3-theme-surface);
    border-right: 1px solid var(--b3-border-color);

    .EnLifeLogSideGraph {
      transform: unset;
      height: 100%;
    }
  }

  .EnLifeLogGraphItem {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    font-size: var(--en-lifelog-graph-font-size, 8px);
    color: var(--b3-theme-on-background);
    width: 100%;
    position: relative;
    justify-content: flex-end;
    box-sizing: border-box;

    .EnLifeLogItemBg {
      width: 100%;
      height: calc(100% - 1px);
      position: absolute;
      top: 0;
      left: 0;
      z-index: 0;
      opacity: 0.2;
    }

    .infos {
      display: inline-block;
      opacity: 0;
      width: 100%;
      padding: 4px;
      box-sizing: border-box;
    }

    .info {
      overflow: hidden;
      text-overflow: ellipsis;
      width: 100%;
      white-space: nowrap;
    }

  }

  &:hover {
    .EnLifeLogGraphItem {

      &[data-en_lifelog_show_info="true"] {
        .infos {
          opacity: 1;
        }
      }
    }
  }
}
</style>
