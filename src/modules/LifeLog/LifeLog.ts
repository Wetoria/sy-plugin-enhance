import {
  batchGetBlockAttrs,
  batchSetBlockAttrs,
  flushTransactions,
  sql,
} from '@/api'
import { EN_EVENT_BUS_KEYS } from '@/utils/Constants'
import { enEventBus } from '@/utils/EnEventBus'
import { getColorStringWarn } from '@/utils/Log'
import {
  EnhanceIOperation,
  onEditorUpdate,
  SyDomNodeTypes,
} from '@/utils/Siyuan'
import { trimSqlBlank } from '@/utils/sql'
import dayjs from 'dayjs'
import {
  ComputedRef,
  inject,
  provide,
  Ref,
} from 'vue'

const lifelogPrefix = 'custom-lifelog-'
const lifelogAttrTime = `${lifelogPrefix}time`
const lifelogAttrDate = `${lifelogPrefix}date`
const lifelogAttrType = `${lifelogPrefix}type`
const lifelogAttrContent = `${lifelogPrefix}content`
const lifelogAttrCreated = `${lifelogPrefix}created`
const lifelogAttrUpdated = `${lifelogPrefix}updated`



/**
 * LifeLog 相关的键值映射对象
 *
 * @property {string} prefix - LifeLog 属性的前缀 ('custom-lifelog-')
 * @property {string} time - 时间属性的键名 ('custom-lifelog-time')
 * @property {string} date - 日期属性的键名 ('custom-lifelog-date')
 * @property {string} type - 类型属性的键名 ('custom-lifelog-type')
 * @property {string} content - 内容属性的键名 ('custom-lifelog-content')
 * @property {string} created - 创建时间属性的键名 ('custom-lifelog-created')
 * @property {string} updated - 更新时间属性的键名 ('custom-lifelog-updated')
 * @property {string} datetimeFormatString - 日期时间的格式化字符串，格式为 YYYY/MM/DD HH:mm:ss
 * @property {string} endFormatString - 结束时间的格式化字符串，格式为 YYYY/MM/DD 23:59:59
 * @property {string} startFormatString - 开始时间的格式化字符串，格式为 YYYY/MM/DD 00:00:00
 */
export const lifelogKeyMap = {
  prefix: lifelogPrefix,
  time: lifelogAttrTime,
  date: lifelogAttrDate,
  type: lifelogAttrType,
  content: lifelogAttrContent,
  created: lifelogAttrCreated,
  updated: lifelogAttrUpdated,

  YYYY_MM_DD: 'YYYY/MM/DD',
  HH_mm_ss: 'HH:mm:ss',
  YYYY_MM_DD_HH_mm_ss: 'YYYY/MM/DD HH:mm:ss',
  YYYY_MM_DD_23_59_59: 'YYYY/MM/DD 23:59:59',
  YYYY_MM_DD_00_00_00: 'YYYY/MM/DD 00:00:00',
}


export function markLifeLogBlock() {

  return onEditorUpdate(async (operations: EnhanceIOperation[]) => {
    let optList = operations.filter((i) => i.text)
    optList.sort((a, b) => a.timestamp - b.timestamp)

    const optMap = {}

    optList.forEach((opt: EnhanceIOperation) => {
      optMap[opt.id] = opt
    })

    optList = Object.values(optMap)
    optList = optList.filter((i) => i.nodeType === SyDomNodeTypes.NodeParagraph)

    if (!optList.length) {
      enWarn(`LifeLog watched no paragraph`)
      return
    }

    enLog(`${getColorStringWarn('LifeLog watched paragraph list changed: ')}`, optList)

    const validParagraphList: Array<EnhanceIOperation & {
      content: string
      time: string
      contentWithoutTime: string
    }> = []


    // 先在前端进行过滤，防止频繁的请求后端
    optList.forEach((opt) => {
      const content = opt.text

      // const isLifeLogParagraph = /^\d{2}:\d{2}\s+/.test(content)
      const isLifeLogParagraph = /^\d{2}:\d{2}(:\d{2})?\s+(?:\S[^\n\r]*)?$/.test(content)

      if (!isLifeLogParagraph) {
        enLog(`${getColorStringWarn('LifeLog is not a valid paragraph: ')}`, opt)
        return
      }
      const time = (content.match(/^\d{2}:\d{2}(:\d{2})?/) || [])[0]

      let dom = document.createElement('div')
      dom.innerHTML = opt.data
      dom = dom.firstElementChild as HTMLDivElement
      const editDom = dom.firstElementChild
      const isPureTimeStart = editDom.innerHTML.trim().startsWith(time)

      if (!isPureTimeStart) {
        enLog('LifeLog is not start with pure time')
        return
      }

      const contentWithoutTime = content.replace(/^\d{2}:\d{2}(:\d{2})?\s+/, '')
      if (!contentWithoutTime) {
        enLog('LifeLog only has time')
        return
      }

      validParagraphList.push({
        ...opt,
        content,
        time,
        contentWithoutTime,
      })
    })



    if (!validParagraphList.length) {
      enWarn(`LifeLog module found no valid paragraph.`)
      return
    }



    // flush sqlite，防止数据库里没更新相关内容
    enWarn(`LifeLog module ready to flush transactions. In order to confirm the changes, please wait for a moment.`)
    await flushTransactions()



    const blockIds = validParagraphList.map((i) => i.id)

    const blockAttrsRes = await batchGetBlockAttrs(blockIds)

    const newBlockAttrs = []

    let readyToReLoadDate = []
    for (const opt of validParagraphList) {
      const blockAttrs = blockAttrsRes[opt.id]

      let colonIndex = opt.contentWithoutTime.indexOf('：')
      colonIndex = colonIndex < 0 ? opt.contentWithoutTime.length : colonIndex

      const logType = opt.contentWithoutTime.substring(0, colonIndex)
      const logContent = opt.contentWithoutTime.substring(colonIndex + 1, opt.contentWithoutTime.length)

      let createdTime = blockAttrs[lifelogAttrCreated]
      let date = blockAttrs[lifelogAttrDate]
      const isFirstCreate = !(createdTime)
      if (isFirstCreate) {
        createdTime = dayjs().format(lifelogKeyMap.YYYY_MM_DD_HH_mm_ss)
      }
      const updatedTime = dayjs().format(lifelogKeyMap.YYYY_MM_DD_HH_mm_ss)

      if (!date) {
      // 如果没有LifeLog的日期，需要按照DailyNote的日期来设置
        const sqlStmt = `
        select
          b.id,
          b.name,
          b.fcontent,
          b.type,
          a.id attr_id,
          a.name attr_name,
          a.value attr_value
        from blocks b
        left join attributes a on b.id = a.block_id
        where b.id in (select root_id from blocks where id = '${opt.id}')
        and a.name like 'custom-dailynote-%'
        order by a.name desc
        limit 1
      `
        const res = await sql(trimSqlBlank(sqlStmt))

        // 没查到 Daily Note 文档的话，不算做 LifeLog
        if (!res[0]?.attr_value) {
          enLog(`${getColorStringWarn('LifeLog record is not in a daily note: ')}`, opt)
          continue
        }
        date = dayjs(res[0]?.attr_value).format(lifelogKeyMap.YYYY_MM_DD)
      }

      const newResult = {
        [lifelogAttrTime]: opt.time,
        [lifelogAttrDate]: date,
        [lifelogAttrType]: logType,
        [lifelogAttrContent]: logContent,
        [lifelogAttrCreated]: createdTime,
        [lifelogAttrUpdated]: updatedTime,
      }

      readyToReLoadDate.push(date)

      newBlockAttrs.push({
        id: opt.id,
        attrs: newResult,
      })
    }
    await batchSetBlockAttrs(newBlockAttrs)
    await flushTransactions()
    readyToReLoadDate = Array.from(new Set(readyToReLoadDate))
    enEventBus.emit(EN_EVENT_BUS_KEYS.LIFELOG_LOAD_RECORDS_BY_DATE_LIST, readyToReLoadDate)
  }, 1000)
}


export function provideLifeLogRecords(records: Ref<Array<ILifeLogRecord>>) {
  provide('lifelogRecords', records)
}
export function injectLifeLogRecords(): Ref<Array<ILifeLogRecord>> {
  return inject('lifelogRecords')
}

export function provideSplitedLifeLogRecords(records: ComputedRef<Array<ILifeLogRecord>>) {
  provide('splitedLifelogRecords', records)
}
export function injectSplitedLifeLogRecords(): ComputedRef<Array<ILifeLogRecord>> {
  return inject('splitedLifelogRecords')
}


export function getTargetLifelogRecordsByDateList(lifelogRecords: Array<ILifeLogRecord>, dateList: Array<string>): Array<ILifeLogRecord> {
  if (!dateList.length) return

  const isMultiDate = dateList.length > 1
  if (isMultiDate) {
    dateList.sort((a, b) => dayjs(a).diff(dayjs(b), 'day'))
  }

  const lastDateInList = dayjs(dateList[dateList.length - 1])
  const firstDateInList = dayjs(dateList[0])

  const startDate = dayjs(firstDateInList.format(lifelogKeyMap.YYYY_MM_DD_00_00_00))
  const endDate = dayjs(lastDateInList.format(lifelogKeyMap.YYYY_MM_DD_23_59_59))


  return lifelogRecords.filter((item) => {
    return (
      item.endTime?.isAfter(startDate) && item.endTime?.isBefore(endDate)
    )
    || (
      item.startTime?.isAfter(startDate) && item.startTime?.isBefore(endDate)
    )
  })
}
