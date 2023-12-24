
import { EnhanceIOperation, SyDomNodeTypes, onEditorUpdate } from '../../utils/Siyuan'
import { getBlockAttrs, setBlockAttrs } from '@/api'
import { useSettings } from '@/logic'
import { usePlugin } from '@/main'
import axios from 'axios'

const lifelogPrefix = 'custom-lifelog-'
const lifelogAttrKey = `${lifelogPrefix}synced`
const lifelogAttrTime = `${lifelogPrefix}time`
const lifelogAttrType = `${lifelogPrefix}type`
const lifelogAttrContent = `${lifelogPrefix}content`

export function markLifeLogBlock() {
  onEditorUpdate(async (operations: EnhanceIOperation[]) => {
    let optList = operations.filter(i => i.text)
    optList.sort((a, b) => a.timestamp - b.timestamp)

    const optMap = {}

    optList.forEach((opt: EnhanceIOperation) => {
      optMap[opt.id] = opt
    })

    optList = Object.values(optMap)
    optList = optList.filter(i => i.nodeType === SyDomNodeTypes.NodeParagraph)


    const records: LifeLogItem[] = []
    for (const opt of optList) {
      const blockAttrs = await getBlockAttrs(opt.id)

      const synced = lifelogAttrKey in blockAttrs
      if (synced) {
        return
      }

      const content = opt.text

      const isLifeLogParagraph = /^\d{2}:\d{2}\s+/.test(content)
      if (!isLifeLogParagraph) {
        return
      }
      const time = (content.match(/^\d{2}:\d{2}/) || [])[0]
      const elseContent = content.replace(/^\d{2}:\d{2}\s+/, '')

      if (!elseContent) {
        return
      }
      let colonIndex = elseContent.indexOf('：')
      colonIndex = colonIndex < 0 ? elseContent.length : colonIndex
      const logType = elseContent.substring(0, colonIndex)
      const logContent = elseContent.substring(colonIndex + 1, elseContent.length)

      const plugin = usePlugin()
      records.push({
        time,
        type: logType,
        content: logContent,
        syBlockId: opt.id,
        isMobile: plugin.isMobile,
      })

      setBlockAttrs(opt.id, {
        [lifelogAttrTime]: time,
        [lifelogAttrType]: logType,
        [lifelogAttrContent]: logContent,
      })
    }

    const settings = useSettings()
    const lifelogPostUrl = settings.value.lifelogPostUrl
    if (!lifelogPostUrl) {
      return
    }

    axios.post(
      lifelogPostUrl,
      {
        data: records,
      }
    ).catch((err) => {
      console.error('[Enhance]| LifeLog Post Error: ', err)
    })
  })
}
