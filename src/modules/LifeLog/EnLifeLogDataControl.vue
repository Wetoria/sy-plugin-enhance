<template>
  <slot></slot>
</template>

<script setup lang="ts">
import { sql } from '@/api'
import {
  lifelogKeyMap,
  provideLifeLogRecords,
  provideSplitedLifeLogRecords,
} from '@/modules/LifeLog/LifeLog'
import { EN_EVENT_BUS_KEYS } from '@/utils/Constants'


import { diffFormat } from '@/utils/Date'
import { enEventBus } from '@/utils/EnEventBus'
import { trimSqlBlank } from '@/utils/sql'
import dayjs from 'dayjs'
import {
  computed,
  onMounted,
  ref,
} from 'vue'

const lifelogRecords = ref<Array<ILifeLogRecord>>([])
provideLifeLogRecords(lifelogRecords)

// 按照日期对 LifeLog 进行切片
const splitedLifelogRecords = computed<Array<ILifeLogRecord>>(() => {
  const result: Array<ILifeLogRecord> = []
  lifelogRecords.value.forEach((item, index) => {
    const prevItem = lifelogRecords.value[index - 1]
    const startTime = prevItem ? prevItem.endTime : null
    const endTime = item.endTime

    if (!startTime) {
      const adjustStartTime = dayjs(item.endTime.format(lifelogKeyMap.YYYY_MM_DD_00_00_00))
      const adjustDiff = endTime.diff(adjustStartTime, 'seconds')
      result.push({
        ...item,
        startTime: adjustStartTime,
        startTimeFormatted: adjustStartTime.format(lifelogKeyMap.YYYY_MM_DD_HH_mm_ss),
        endTimeFormatted: endTime.format(lifelogKeyMap.YYYY_MM_DD_HH_mm_ss),
        diff: adjustDiff,
        diffFormatted: diffFormat(adjustDiff),
      })
      return
    }
    const isSameDay = dayjs(startTime).isSame(dayjs(endTime), 'day')
    if (isSameDay) {
      const diff = endTime.diff(startTime, 'seconds')
      const diffFormatted = diffFormat(diff)
      const totalDiff = endTime.diff(startTime, 'seconds')
      const totalDiffFormatted = diffFormat(totalDiff)

      result.push({
        ...item,
        startTime,
        startTimeFormatted: startTime.format(lifelogKeyMap.YYYY_MM_DD_HH_mm_ss),
        endTime,
        endTimeFormatted: endTime.format(lifelogKeyMap.YYYY_MM_DD_HH_mm_ss),
        diff,
        diffFormatted,
        totalDiff,
        totalDiffFormatted,
      })

      return
    }

    // 分割成两个
    const prevDayItem: ILifeLogRecord = {
      ...item,
      startTime,
      endTime: dayjs(startTime.format(lifelogKeyMap.YYYY_MM_DD_23_59_59)),
    }
    prevDayItem.startTimeFormatted = prevDayItem.startTime.format(lifelogKeyMap.YYYY_MM_DD_HH_mm_ss)
    prevDayItem.endTimeFormatted = prevDayItem.endTime.format(lifelogKeyMap.YYYY_MM_DD_HH_mm_ss)


    const prevDayDiff = prevDayItem.endTime.diff(prevDayItem.startTime, 'seconds')
    prevDayItem.diff = prevDayDiff
    prevDayItem.diffFormatted = diffFormat(prevDayDiff)


    const currentDayItem: ILifeLogRecord = {
      ...item,
      startTime: dayjs(item.endTime.format(lifelogKeyMap.YYYY_MM_DD_00_00_00)),
      endTime: item.endTime,
    }
    currentDayItem.startTimeFormatted = currentDayItem.startTime.format(lifelogKeyMap.YYYY_MM_DD_HH_mm_ss)
    currentDayItem.endTimeFormatted = currentDayItem.endTime.format(lifelogKeyMap.YYYY_MM_DD_HH_mm_ss)

    const currentDayDiff = currentDayItem.endTime.diff(currentDayItem.startTime, 'seconds')
    currentDayItem.diff = currentDayDiff
    currentDayItem.diffFormatted = diffFormat(currentDayDiff)

    const totalDiff = currentDayItem.endTime.diff(prevDayItem.startTime, 'seconds')
    const totalDiffFormatted = diffFormat(totalDiff)
    prevDayItem.totalDiff = totalDiff
    prevDayItem.totalDiffFormatted = totalDiffFormatted
    currentDayItem.totalDiff = totalDiff
    currentDayItem.totalDiffFormatted = totalDiffFormatted

    result.push(prevDayItem, currentDayItem)
  })
  return result
})
provideSplitedLifeLogRecords(splitedLifelogRecords)

function getDate(record: ILifeLog) {
  return dayjs(record[lifelogKeyMap.date] || record[lifelogKeyMap.created]).format(lifelogKeyMap.YYYY_MM_DD)
}


const loadDataByDateList = async (dateList: Array<string>) => {
  if (!dateList.length) return

  const isMultiDate = dateList.length > 1
  if (isMultiDate) {
    dateList.sort((a, b) => dayjs(a).diff(dayjs(b), 'day'))
  }

  const lastDateInList = dayjs(dateList[dateList.length - 1])
  const firstDateInList = dayjs(dateList[0])

  // 设置成最后一天的后一天的 23:59:59，用于获取跨天的数据
  const endDate = lastDateInList.add(1, 'day')
  const startDate = firstDateInList.subtract(1, 'day')

  const sqlStmt = `
    -- en query lifelog records\n
    SELECT
      block_id,
      '{' || GROUP_CONCAT('"' || name || '":"' || value || '"') || '}' as json_attributes
    FROM
      attributes
    WHERE
      block_id IN (
        SELECT block_id
        FROM attributes
        WHERE name = '${lifelogKeyMap.type}'
      )
      AND block_id IN (
        SELECT a.block_id
        FROM attributes a
        WHERE (
          EXISTS (
            SELECT 1 FROM attributes b
            WHERE b.block_id = a.block_id
            AND b.name = '${lifelogKeyMap.date}'
            AND b.value >= '${startDate.format(lifelogKeyMap.YYYY_MM_DD)}'
            AND b.value <= '${endDate.format(lifelogKeyMap.YYYY_MM_DD)}'
          )
        ) OR (
          NOT EXISTS (
            SELECT 1 FROM attributes b
            WHERE b.block_id = a.block_id
            AND b.name = '${lifelogKeyMap.date}'
          )
          AND a.name = '${lifelogKeyMap.created}'
          AND a.value >= '${startDate.format(lifelogKeyMap.YYYY_MM_DD_00_00_00)}'
          AND a.value <= '${endDate.format(lifelogKeyMap.YYYY_MM_DD_23_59_59)}'
        )
      )
    GROUP BY
      block_id
    limit 9999999
  `

  const res = await sql(trimSqlBlank(sqlStmt))

  if (!res) {
    return
  }
  const temp: {
    block_id: string
    record: ILifeLog
    endTime: string
    date: string
  }[] = res.map((item) => {
    const jsonRecord = JSON.parse(item.json_attributes) as ILifeLog

    let endTime = jsonRecord[lifelogKeyMap.time]
    const date = getDate(jsonRecord)

    // 如果是两位的时间，需要补上秒
    if (/\d{2}:\d{2}/.test(endTime)) {
      const temp = dayjs(`${date} ${endTime}:00`)
      const tempCreated = dayjs(jsonRecord[lifelogKeyMap.created])

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
    return dayjs(`${a.date} ${a.endTime}`)
      .diff(dayjs(`${b.date} ${b.endTime}`), 'seconds')
  })

  lifelogRecords.value = lifelogRecords.value.filter((item) => {
    return !temp.find((i) => i.block_id === item.block_id)
  })


  temp.forEach((readyItem, index) => {
    const prevItem = temp[index - 1]

    const startTime = prevItem ? dayjs(`${getDate(prevItem.record)} ${prevItem.endTime}`) : null
    const endTime = dayjs(`${getDate(readyItem.record)} ${readyItem.endTime}`)


    const result: ILifeLogRecord = {
      block_id: readyItem.block_id,
      record: readyItem.record,
      type: readyItem.record[lifelogKeyMap.type],
      content: readyItem.record[lifelogKeyMap.content],
      startTime,
      endTime,
      diff: undefined,
      diffFormatted: undefined,
      totalDiff: undefined,
      totalDiffFormatted: undefined,
    }
    lifelogRecords.value.push(result)
  })


  lifelogRecords.value.sort((a, b) => {
    return dayjs(a.endTime).diff(dayjs(b.endTime), 'seconds')
  })
}

onMounted(() => {
  enEventBus.on(EN_EVENT_BUS_KEYS.LIFELOG_LOAD_RECORDS_BY_DATE_LIST, (dateList: string[]) => {
    loadDataByDateList(dateList)
  })
})
</script>

<style lang="scss" scoped>

</style>
