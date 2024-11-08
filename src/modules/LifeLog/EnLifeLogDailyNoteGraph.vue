<template>
  <Teleport
    :to="element?.parentNode"
  >
    <div
      class="EnLifeLogDailyNoteGraph"
      v-if="isDailyNote"
      ref="EnLifeLogDailyNoteGraphRef"
    >
      <div
        v-for="record of lifelogRecords"
        class="EnLifeLogGraphItem"
        :key="record.block_id"
        :data-en_lifelog_diff="record.diff"
        :data-en_lifelog_diff_format="record.diffFormatted"
        :style="{
          height: `${(record.diff / secondsOfADay) * 100}%`
        }"
      >
        <div
          class="EnLifeLogItemBg"
          :style="{
            backgroundColor: `var(--en-lifelog-${record.record['custom-lifelog-type']})`,
          }"
        >

        </div>
        <div class="infos">
          <div
            class="time info"
            v-if="(record.diff / secondsOfADay) > 0.01"
          >
            {{ record.endTime }}
          </div>
          <div class="info">
            {{
              [
                record.record['custom-lifelog-type'],
                record.record['custom-lifelog-content']
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
          top: `${((currentSecondDiff / secondsOfADay) * 100)}%`
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
import { sql } from '@/api';
import dayjs from 'dayjs'
import { computed, onBeforeUnmount, onMounted, onUpdated, ref, watchEffect } from 'vue';
import { ILifeLog } from './LifeLog.vue';
import { diffFormat } from '@/utils/Date'
import { queryAllByDom } from '@/utils/DOM';

const props = defineProps<{
  element: HTMLDivElement
}>()

const wysiwyg = computed<HTMLDivElement | null>(() => props?.element?.querySelector('.protyle-wysiwyg'))
const isDailyNote = computed(() => {
  return wysiwyg.value?.dataset.en_is_dailynote
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
  load()
  window.addEventListener('resize', checkHeight);
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', checkHeight);
})
onUpdated(() => {
  checkHeight()
})

const current = ref(dayjs())
setInterval(() => {
  current.value = dayjs()
}, 1000)
const currentSecondDiff = computed(() => {
  const startOfToday = current.value.startOf('day');
  const secondsUntilMidnight = current.value.diff(startOfToday, 'second');
  return secondsUntilMidnight
})

function getDate(record: ILifeLog) {
  return dayjs(record['custom-lifelog-date'] || record['custom-lifelog-created']).format('YYYY/MM/DD')
}

function calcDiff(record: ILifeLog, secondRecord: ILifeLog) {
  return dayjs(getDate(record) + ' ' + record['custom-lifelog-time'])
    .diff(dayjs(getDate(secondRecord) + ' ' + secondRecord['custom-lifelog-time']), 'seconds')
}

const lifelogRecords = ref<Array<{
  block_id: string;
  record: ILifeLog;
  startTime?: string;
  endTime?: string;
  // 当天内的持续时间
  diff?: number;
  diffFormatted?: string;
  // 记录的完整持续时间，截止上一条记录。可能跨天。
  totalDiff?: number;
  totalDiffFormatted?: string;
}>>([])
const load = async () => {
  if (!isDailyNote.value) return

  const dailyNoteDate = dayjs(wysiwyg.value?.dataset.en_dailynote_date, 'YYYYMMDD')
  const dailyNoteDateStr = dailyNoteDate.format('YYYY/MM/DD')
  const yesterdayStr = dailyNoteDate.subtract(1, 'day').format('YYYY/MM/DD')
  const tomorrowStr = dailyNoteDate.add(1, 'day').format('YYYY/MM/DD')
  const sqlStmt = `
    SELECT
      block_id,
      '{' || GROUP_CONCAT('"' || name || '":"' || value || '"') || '}' as json_attributes
    FROM
      attributes
    WHERE
      block_id IN (
        SELECT block_id
        FROM attributes
        WHERE name = 'custom-lifelog-type'
      )
      AND block_id IN (
        SELECT block_id
        FROM attributes
        WHERE (
          name = 'custom-lifelog-created'
          AND value like '${dailyNoteDateStr}%'
          OR value like '${yesterdayStr}%'
          OR value like '${tomorrowStr}%'
        )
        OR (
          name = 'custom-lifelog-date'
          AND value = '${dailyNoteDateStr}'
          OR value = '${yesterdayStr}'
          OR value = '${tomorrowStr}'
        )
      )
    GROUP BY
      block_id
    limit 9999999
  `
  sql(sqlStmt).then((res) => {
    if (!res) {
      return
    }
    const temp = res.map((item) => {
      const jsonRecord = JSON.parse(item.json_attributes) as ILifeLog

      let endTime = jsonRecord['custom-lifelog-time']
      const date = getDate(jsonRecord)

      // 如果是两位的时间，需要补上秒
      if (/\d{2}:\d{2}/.test(endTime)) {
        const temp = dayjs(`${dailyNoteDateStr} ${endTime}:00`)
        const tempCreated = dayjs(jsonRecord['custom-lifelog-created'])

        // 如果创建时间属于 Daily Note 同一天，则用创建的时间的 秒 数，作为 LifeLog 的 秒 数
        const isSame = dayjs(temp).set('second', 0).set('millisecond', 0).isSame(dayjs(tempCreated).set('second', 0).set('millisecond', 0))
        if (isSame) {
          endTime += `:${tempCreated.format('ss')}`
        } else {
          endTime += ':00'
        }
      }
      return {
        block_id: item.block_id,
        record: jsonRecord,
        endTime,
        date,
      }
    })
    temp.sort((a, b) => {
      return a.date === b.date ? 0 : a.date < b.date ? -1 : 1
    })

    const yesterDayRecords = temp.filter(item => getDate(item.record) === yesterdayStr)
    const tomorrowRecords = temp.filter(item => getDate(item.record) === tomorrowStr)
    const todayRecords = temp.filter(item => getDate(item.record) === dailyNoteDateStr)

    const lastYesterDayRecord = yesterDayRecords[yesterDayRecords.length - 1]
    const firstTomorrowRecord = tomorrowRecords[0]

    if (!todayRecords.length) {
      return
    }

    const firstRecord = todayRecords[0]
    // 首条记录与0点的差异
    const firstDiff = calcDiff(firstRecord.record, {
      'custom-lifelog-date': dailyNoteDateStr,
      'custom-lifelog-time': '00:00:00',
    } as ILifeLog)
    // 首条记录与昨日最后一条记录的差异
    const firstTotalDiff = lastYesterDayRecord ? calcDiff(firstRecord.record, lastYesterDayRecord?.record) : firstDiff
    const fixedFirstRecord = {
      block_id: firstRecord.block_id,
      record: firstRecord.record,
      startTime: '00:00:00',
      endTime: firstRecord.endTime,
      diff: firstDiff,
      diffFormatted: diffFormat(firstDiff),
      totalDiff: firstTotalDiff,
      totalDiffFormatted: diffFormat(firstTotalDiff),
    }
    lifelogRecords.value = todayRecords.map((item, index) => {
      const isFirst = index === 0
      if (isFirst) {
        return fixedFirstRecord
      }

      const lastRecord = todayRecords[index - 1]
      const lastRecordEndTimeDayjs = dayjs(getDate(lastRecord.record as ILifeLog) + ' ' + lastRecord.endTime)

      const startTime = lastRecord.endTime
      const endTime = item.endTime
      const currentRecordStartTimeDayjs = dayjs(getDate(lastRecord.record as ILifeLog) + ' ' + startTime)

      const diff = dayjs(getDate(item.record) + ' ' + endTime)
        .diff(currentRecordStartTimeDayjs, 'seconds')
      const totalDiff = dayjs(getDate(item.record) + ' ' + endTime)
        .diff(lastRecordEndTimeDayjs, 'seconds')

      return {
        block_id: item.block_id,
        record: item.record,
        startTime,
        endTime,
        diff,
        diffFormatted: diffFormat(diff),
        totalDiff,
        totalDiffFormatted: diffFormat(totalDiff),
      }
    })

    if (firstTomorrowRecord) {
      const lastTodayRecord = todayRecords[todayRecords.length - 1]
      const firstDiff = calcDiff({
        'custom-lifelog-date': dailyNoteDateStr,
        'custom-lifelog-time': '23:59:59',
      } as ILifeLog, lastTodayRecord.record)

      const firstTotalDiff = calcDiff(firstTomorrowRecord.record, lastTodayRecord?.record)

      const lastRecord = {
        block_id: firstTomorrowRecord.block_id,
        record: firstTomorrowRecord.record,
        startTime: lastTodayRecord.endTime,
        endTime: '23:59:59',
        diff: firstDiff,
        diffFormatted: diffFormat(firstDiff),
        totalDiff: firstTotalDiff,
        totalDiffFormatted: diffFormat(firstTotalDiff),
      }
      if (firstDiff > 60) {
        lifelogRecords.value.push(lastRecord)
      }
    }


    if (dailyNoteId.value) {
      dailyNoteId.value = ''
    }
    checkHeight()
  })
}

watchEffect(() => {
  if (dailyNoteId.value) {
    load()
  }
})

</script>

<script lang="ts">

const dailyNoteId = ref('')
export function reloadLifeLogData(newLifeLogParagraphId: string) {
  dailyNoteId.value = newLifeLogParagraphId
}
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
