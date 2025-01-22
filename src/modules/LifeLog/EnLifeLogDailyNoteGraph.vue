<template>
  <Teleport
    :to="enProtyleItem.protyleContentEl?.parentNode"
  >
    <div
      ref="EnLifeLogDailyNoteGraphRef"
      class="EnLifeLogDailyNoteGraph"
    >
      <div
        v-for="record of graphRecords"
        :key="record.block_id"
        class="EnLifeLogGraphItem"
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
          <div
            v-if="(record.diff / secondsOfADay) > 0.01"
            class="time info"
          >
            {{ record.endTime.format(lifelogKeyMap.HH_mm_ss) }}
          </div>
          <div class="info">
            {{
              [
                record.type,
                record.content,
              ].filter(Boolean).join('：')
            }}
          </div>
          <div
            class="info"
          >
            持续：{{ record.totalDiffFormatted }}
          </div>
        </div>
      </div>

      <div class="PromptArea">
        <div
          v-for="index of 24"
          :key="index"
          class="PromptItem"
        >
          <div class="PromptTimeItem">
            <div class="divider"></div>
            <span class="time">
              {{ index }}:00
            </span>
          </div>
        </div>
      </div>

      <div
        class="PromptCurrent"
        :style="{
          top: `${((currentSecondDiff / secondsOfADay) * 100)}%`,
        }"
        :data-test="currentSecondDiff"
      >
        <div class="PromptTimeItem">
          <div class="divider"></div>
          <span class="time">
            {{ current.format('HH:mm') }}
          </span>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import {
  getTargetLifelogRecordsByDateList,
  injectSplitedLifeLogRecords,
} from '@/modules/LifeLog/LifeLog'
import { EN_EVENT_BUS_KEYS } from '@/utils/Constants'
import { queryAllByDom } from '@/utils/DOM'
import { enEventBus } from '@/utils/EnEventBus'
import dayjs from 'dayjs'
import {
  computed,
  onBeforeUnmount,
  onMounted,
  onUpdated,
  ref,
} from 'vue'
import { lifelogKeyMap } from './LifeLog'


const props = defineProps<{
  enProtyleItem: IProtyleObserverItem
}>()

const dayList = computed(() => {
  return props.enProtyleItem.dailyNoteValues
})
const dayValueList = computed(() => {
  return Object.values(dayList.value).map((item) => `${item}`)
})

const splitedLifelogRecords = injectSplitedLifeLogRecords()

const graphRecords = computed(() => {
  return getTargetLifelogRecordsByDateList(splitedLifelogRecords.value, dayValueList.value)
})

onMounted(() => {
  enEventBus.emit(EN_EVENT_BUS_KEYS.LIFELOG_LOAD_RECORDS_BY_DATE_LIST, dayValueList.value)
})


const secondsOfADay = 60 * 60 * 24
const EnLifeLogDailyNoteGraphRef = ref()
function checkHeight() {
  const itemList = queryAllByDom(EnLifeLogDailyNoteGraphRef.value, '.EnLifeLogGraphItem')

  itemList.forEach((item: HTMLDivElement) => {
    if (item.offsetHeight > 20) {
      item.dataset.en_lifelog_show_info = 'true'
    } else {
      item.dataset.en_lifelog_show_info = 'false'
    }
  })

  const promptItemList = queryAllByDom(EnLifeLogDailyNoteGraphRef.value, '.PromptItem')
  promptItemList.forEach((item: HTMLDivElement) => {
    if (item.offsetHeight > 20) {
      item.dataset.en_lifelog_show_info = 'true'
    } else {
      item.dataset.en_lifelog_show_info = 'false'
    }
  })
}

onMounted(() => {
  window.addEventListener('resize', checkHeight)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', checkHeight)
})
onUpdated(() => {
  checkHeight()
})

const current = ref(dayjs())
onMounted(() => {
  setInterval(() => {
    current.value = dayjs()
  }, 1000)
})
const currentSecondDiff = computed(() => {
  const startOfToday = current.value.startOf('day')
  const secondsUntilMidnight = current.value.diff(startOfToday, 'second')
  return secondsUntilMidnight
})


</script>

<style lang="scss" scoped>
.EnLifeLogDailyNoteGraph {
  position: absolute;
  left: 0;
  top: 30px;
  width: 5px;
  height: calc(100% - 30px - 4px);
  background-color: rgba(109, 109, 109, 0.1);
  display: flex;
  flex-direction: column;
  z-index: 9;

  --en-lifelog-graph-font-size: 8px;


  .EnLifeLogGraphItem {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    font-size: var(--en-lifelog-graph-font-size, 8px);
    color: white;
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
      display: none;
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

  .PromptTimeItem {
    width: 100%;

    position: absolute;
    // bottom: calc(var(--en-lifelog-graph-font-size, 8px));
    bottom: 0;

    display: flex;
    justify-content: flex-end;
    align-items: flex-end;

    box-sizing: border-box;

    .divider {
      flex: 1;
      border-top: 1px solid rgba(109, 109, 109, 0.1);
      height: 0;
    }

    .time {
      transform: translateY(4px);
    }
  }

  .PromptArea {
    width: 100%;
    height: 100%;
    position: absolute;
    z-index: 1;
    top: 0;
    left: 0;
    font-size: var(--en-lifelog-graph-font-size, 8px);
    display: none;



    .PromptItem {
      height: calc(100% / 24);

      display: flex;
      flex-direction: column;
      justify-content: flex-end;

      position: relative;

      .divider {
        border-top: 1px solid rgba(109, 109, 109);
      }

      &[data-en_lifelog_show_info="false"] {
        .time {
          display: none;
        }
      }
    }

  }

  .PromptCurrent {
    position: absolute;
    right: 0px;
    color: red;

    width: 100%;

    font-size: var(--en-lifelog-graph-font-size, 8px);
    font-weight: bold;

    .divider {
      border-top: 1px solid red;
    }

    .time {
      display: none;
    }
  }

  &:hover {
    width: 100px;
    background: var(--b3-theme-surface);
    border-right: 1px solid rgba(109, 109, 109);

    .EnLifeLogGraphItem {


      &[data-en_lifelog_show_info="true"] {
        .infos {
          display: inline-block;
        }
      }
    }

    .PromptArea {
      display: flex;
      flex-direction: column;
    }

    .PromptTimeItem {
      gap: 4px;
      padding-right: 2px;
    }

    .PromptCurrent {
      z-index: 1;
      .time {
        display: inline-block;
      }
    }
  }
}
</style>
