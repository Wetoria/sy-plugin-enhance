import {
  batchGetBlockAttrs,
  batchSetBlockAttrs,
  flushTransactions,
  sql,
} from '@/api'
import { getColorStringWarn } from '@/utils/Log'
import {
  EnhanceIOperation,
  onEditorUpdate,
  SyDomNodeTypes,
} from '@/utils/Siyuan'
import dayjs from 'dayjs'

const lifelogPrefix = 'custom-lifelog-'
const lifelogAttrTime = `${lifelogPrefix}time`
const lifelogAttrDate = `${lifelogPrefix}date`
const lifelogAttrType = `${lifelogPrefix}type`
const lifelogAttrContent = `${lifelogPrefix}content`
const lifelogAttrCreated = `${lifelogPrefix}created`
const lifelogAttrUpdated = `${lifelogPrefix}updated`


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
        createdTime = dayjs().format('YYYY/MM/DD HH:mm:ss')
      }
      const updatedTime = dayjs().format('YYYY/MM/DD HH:mm:ss')

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
        const res = await sql(sqlStmt)

        // 没查到 Daily Note 文档的话，不算做 LifeLog
        if (!res[0]?.attr_value) {
          enLog(`${getColorStringWarn('LifeLog record is not in a daily note: ')}`, opt)
          continue
        }
        date = dayjs(res[0]?.attr_value).format('YYYY/MM/DD')
      }

      const newResult = {
        [lifelogAttrTime]: opt.time,
        [lifelogAttrDate]: date,
        [lifelogAttrType]: logType,
        [lifelogAttrContent]: logContent,
        [lifelogAttrCreated]: createdTime,
        [lifelogAttrUpdated]: updatedTime,
      }

      newBlockAttrs.push({
        id: opt.id,
        attrs: newResult,
      })
    }
    await batchSetBlockAttrs(newBlockAttrs)
    // reloadLifeLogData('reload')
  }, 1000)
}
