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
        :data-en_lifelog_diff_format="diffFormat(record.diff)"
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
import { computed, onBeforeUnmount, onBeforeUpdate, onMounted, onUpdated, ref, watchEffect } from 'vue';
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

const lifelogRecords = ref<Array<{
  block_id: string;
  record: ILifeLog;
  startTime?: string;
  endTime?: string;
  diff?: number;
}>>([])
const load = () => {
  if (!isDailyNote.value) return

  const dailyNoteDate = dayjs(wysiwyg.value?.dataset.en_dailynote_date, 'YYYYMMDD').format('YYYY/MM/DD')
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
        WHERE name = 'custom-lifelog-created'
          AND value like '${dailyNoteDate}%'
      )
    GROUP BY
      block_id;
  `
  sql(sqlStmt).then((res) => {
    const temp = res.map((item) => {
      const jsonRecord = JSON.parse(item.json_attributes) as ILifeLog
      let endTime = jsonRecord['custom-lifelog-time']
      if (/\d{2}:\d{2}/.test(endTime)) {
        const temp = dayjs(`${dailyNoteDate} ${endTime}:00`)
        const tempCreated = dayjs(jsonRecord['custom-lifelog-created'])
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
      }
    })

    lifelogRecords.value = temp.map((item, index) => {
      const lastRecord = temp[index - 1] || {
        endTime: `00:00:00`,
      }
      const startTime = lastRecord.endTime
      const endTime = item.endTime
      const diff = dayjs(dailyNoteDate + ' ' + endTime).diff(dayjs(dailyNoteDate + ' ' + startTime), 'seconds')

      return {
        block_id: item.block_id,
        record: item.record,
        startTime,
        endTime,
        diff,
      }
    })

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
        border-top: 1px solid rgba(109, 109, 109, 0.1);
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
    width: fit-content;
    max-width: 100px;

    .EnLifeLogGraphItem {
      box-sizing: border-box;

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
      .time {
        display: inline-block;
      }
    }
  }
}
</style>
