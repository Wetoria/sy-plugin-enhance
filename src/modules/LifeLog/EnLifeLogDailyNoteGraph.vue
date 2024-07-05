<template>
  <Teleport
    :to="element?.parentNode"
  >
    <div
      class="EnLifeLogDailyNoteGraph"
      v-if="isDailyNote"
    >
      <div
        v-for="record of lifelogRecords"
        :key="record.block_id"
        :data-en_lifelog_diff="record.diff"
        :data-en_lifelog_diff_format="diffFormat(record.diff)"
        :style="{
          backgroundColor: `var(--en-lifelog-${record.record['custom-lifelog-type']})`,
          height: `${(record.diff / secondsOfADay) * 100}%`
        }"
      >
        <!-- {{ `${record.record['custom-lifelog-type']}：${record.record['custom-lifelog-content']}` }} -->
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { sql } from '@/api';
import dayjs from 'dayjs'
import { computed, onMounted, ref, watchEffect } from 'vue';
import { ILifeLog } from './LifeLog.vue';
import { diffFormat } from '@/utils/Date'

const props = defineProps<{
  element: HTMLDivElement
}>()

const wysiwyg = computed<HTMLDivElement | null>(() => props?.element?.querySelector('.protyle-wysiwyg'))
const isDailyNote = computed(() => {
  return wysiwyg.value?.dataset.en_is_dailynote
})

const secondsOfADay = 60 * 60 * 24

onMounted(() => {
  load()
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
  height: calc(100% - 30px);
  background-color: rgba(109, 109, 109, 0.1);
  opacity: 0.1;
  display: flex;
  flex-direction: column;
  gap: 1px;

  // &:hover {
  //   width: 10px;
  // }
}
</style>
